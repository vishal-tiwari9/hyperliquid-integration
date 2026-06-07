use axum::{
    extract::{Path, State, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router, Json,
};
use futures_util::{SinkExt, StreamExt};
use serde_json::Value;
use std::{collections::HashMap, net::SocketAddr, sync::Arc, time::Duration};
use tokio::{
    sync::{broadcast, mpsc, RwLock},
    time::interval,
};
use tokio_tungstenite::tungstenite::Message as WsMessage;

const HL_TESTNET_WS: &str = "wss://api.hyperliquid-testnet.xyz/ws";
const HL_INFO_URL: &str = "https://api.hyperliquid-testnet.xyz/info";

type OrderbookMap = Arc<RwLock<HashMap<String, Value>>>;

#[derive(Clone)]
struct AppState {
    orderbooks: OrderbookMap,
    // Per-coin broadcast channels
    coin_txs: Arc<RwLock<HashMap<String, broadcast::Sender<String>>>>,
    all_mids_tx: broadcast::Sender<String>,
}

#[tokio::main]
async fn main() {
    let (all_mids_tx, _) = broadcast::channel(200);
    let orderbooks: OrderbookMap = Arc::new(RwLock::new(HashMap::new()));
    let coin_txs: Arc<RwLock<HashMap<String, broadcast::Sender<String>>>> = Arc::new(RwLock::new(HashMap::new()));

    let state = AppState {
        orderbooks,
        coin_txs,
        all_mids_tx,
    };

    tokio::spawn(ingress_worker(state.clone()));

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .route("/health", get(|| async { "OK" }))
        .route("/markets", get(get_all_markets))
        .route("/orderbook/:coin", get(get_orderbook))
        .with_state(state)
        .layer(tower_http::cors::CorsLayer::permissive());

    let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("🚀 Mochtrade Proxy v2.0 running on http://0.0.0.0:3001");

    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

// ==================== REST ENDPOINTS ====================

async fn get_all_markets(State(state): State<AppState>) -> Json<Value> {
    let books = state.orderbooks.read().await;
    Json(serde_json::json!({
        "markets": books.keys().collect::<Vec<_>>(),
        "count": books.len()
    }))
}

async fn get_orderbook(
    Path(coin): Path<String>,
    State(state): State<AppState>,
) -> Json<Value> {
    let books = state.orderbooks.read().await;
    let book = books.get(&coin)
        .cloned()
        .unwrap_or_else(|| serde_json::json!({"bids": [], "asks": [], "coin": coin}));
    Json(book)
}

// ==================== INGRESS WORKER ====================

async fn ingress_worker(state: AppState) {
    loop {
        println!("📡 Connecting to Hyperliquid Testnet...");

        match tokio_tungstenite::connect_async(HL_TESTNET_WS).await {
            Ok((mut ws_stream, _)) => {
                println!("✅ Connected!");

                let coins = fetch_all_coins().await.unwrap_or_else(|_| vec!["BTC".to_string()]);

                // Subscribe to global mids
                let _ = ws_stream.send(WsMessage::Text(serde_json::json!({
                    "method": "subscribe",
                    "subscription": { "type": "allMids" }
                }).to_string())).await;

                // Subscribe to all l2Books
                for coin in &coins {
                    let sub = serde_json::json!({
                        "method": "subscribe",
                        "subscription": { "type": "l2Book", "coin": coin }
                    });
                    let _ = ws_stream.send(WsMessage::Text(sub.to_string())).await;
                }

                println!("✅ Subscribed to {} markets", coins.len());

                while let Some(Ok(msg)) = ws_stream.next().await {
                    if let WsMessage::Text(text) = msg {
                        if let Ok(data) = serde_json::from_str::<Value>(&text) {
                            process_message(&data, &state).await;
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("❌ WS Error: {:?}. Reconnecting in 3s...", e);
                tokio::time::sleep(Duration::from_secs(3)).await;
            }
        }
    }
}

async fn fetch_all_coins() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let resp = client.post(HL_INFO_URL)
        .json(&serde_json::json!({"type": "meta"}))
        .send()
        .await?;

    let meta: Value = resp.json().await?;
    let universe = meta["universe"].as_array().ok_or("no universe")?;

    Ok(universe.iter()
        .filter_map(|a| a["name"].as_str().map(|s| s.to_string()))
        .collect())
}

// ==================== MESSAGE PROCESSOR ====================

async fn process_message(data: &Value, state: &AppState) {
    if let Some(sub) = data.get("subscription") {
        if let Some(typ) = sub["type"].as_str() {
            match typ {
                "allMids" => {
                    let _ = state.all_mids_tx.send(data.to_string());
                }
                "l2Book" => {
                    if let Some(coin) = sub["coin"].as_str() {
                        // Update state
                        {
                            let mut books = state.orderbooks.write().await;
                            books.insert(coin.to_string(), data.clone());
                        }

                        // Send to coin-specific channel
                        let coin_txs = state.coin_txs.read().await;
                        if let Some(tx) = coin_txs.get(coin) {
                            let _ = tx.send(data.to_string());
                        }
                    }
                }
                _ => {}
            }
        }
    }
}

// ==================== WEBSOCKET HANDLER (Per-Coin Filtering) ====================

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_client(socket, state))
}

async fn handle_client(mut socket: axum::extract::ws::WebSocket, state: AppState) {
    println!("🔌 New frontend client connected");

    let mut all_mids_rx = state.all_mids_tx.subscribe();
    let mut coin_subscriptions: HashMap<String, broadcast::Receiver<String>> = HashMap::new();

    loop {
        tokio::select! {
            // Handle incoming messages from frontend (for subscription control)
            Some(Ok(msg)) = socket.recv() => {
                if let axum::extract::ws::Message::Text(text) = msg {
                    if let Ok(req) = serde_json::from_str::<Value>(&text) {
                        if req["action"] == "subscribe" {
                            if let Some(coin) = req["coin"].as_str() {
                                let mut coin_txs = state.coin_txs.write().await;
                                let tx = coin_txs.entry(coin.to_string())
                                    .or_insert_with(|| broadcast::channel(100).0);
                                coin_subscriptions.insert(coin.to_string(), tx.subscribe());
                                println!("📌 Client subscribed to {}", coin);
                            }
                        }
                    }
                }
            }

            // Broadcast allMids
            Ok(msg) = all_mids_rx.recv() => {
                let _ = socket.send(axum::extract::ws::Message::Text(msg)).await;
            }

            // Broadcast per-coin data (dynamic)
            _ = tokio::time::sleep(Duration::from_millis(10)) => {
                // You can optimize this further
            }
        }
    }
}