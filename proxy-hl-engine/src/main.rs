use axum::{
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use serde_json::Value;
use std::{collections::{HashMap, HashSet}, net::SocketAddr, sync::Arc};
use tokio::sync::{broadcast, RwLock};
use tokio_tungstenite::tungstenite::Message as WsMessage;

// Official High-Fidelity Mainnet Production Production Endpoints
const HL_MAINNET_WS: &str = "wss://api.hyperliquid.xyz/ws";
const HL_INFO_URL: &str = "https://api.hyperliquid.xyz/info";

type SharedOrderbooks = Arc<RwLock<HashMap<String, Value>>>;

#[derive(Clone)]
struct AppState {
    orderbooks: SharedOrderbooks,
    // High-performance message pipeline handling all real-time tickers smoothly
    global_pipeline_tx: broadcast::Sender<Value>,
}

#[tokio::main]
async fn main() {
    rustls::crypto::ring::default_provider()
        .install_default()
        .expect("Failed to initialize cryptographic ring provider context");

    // Unified broadcast channel supporting up to 1024 backlogged frames
    let (global_pipeline_tx, _) = broadcast::channel::<Value>(1024);
    let orderbooks: SharedOrderbooks = Arc::new(RwLock::new(HashMap::new()));

    let state = AppState {
        orderbooks,
        global_pipeline_tx,
    };

    // Spawn the central background processing service
    tokio::spawn(ingress_data_worker(state.clone()));

    let app = Router::new()
        .route("/ws", get(ws_router_handler))
        .route("/health", get(|| async { "OK" }))
        .route("/markets", get(retrieve_active_markets))
        .with_state(state)
        .layer(tower_http::cors::CorsLayer::permissive());

    let listen_addr = SocketAddr::from(([0, 0, 0, 0], 3001));
    println!("🚀 Mochtrade Production Proxy Running @ http://localhost:3001");

    axum::serve(tokio::net::TcpListener::bind(listen_addr).await.unwrap(), app)
        .await
        .unwrap();
}

async fn retrieve_active_markets(State(state): State<AppState>) -> Json<Value> {
    let memory_books = state.orderbooks.read().await;
    Json(serde_json::json!({
        "markets": memory_books.keys().collect::<Vec<_>>(),
        "count": memory_books.len()
    }))
}

// ==================== HIGH-PERFORMANCE INGRESS WORKER ====================
async fn ingress_data_worker(state: AppState) {
    loop {
        println!("📡 Connecting to Hyperliquid Live Mainnet Cluster Pipeline...");

        match tokio_tungstenite::connect_async(HL_MAINNET_WS).await {
            Ok((mut upstream_ws, _)) => {
                println!("✅ Connected to Hyperliquid Production Wire Network!");

                let asset_universe = fetch_production_universe().await.unwrap_or_else(|_| vec!["BTC".to_string()]);

                // 1. Subscribe to the Global Ticker Matrix Channel
                let all_mids_payload = serde_json::json!({
                    "method": "subscribe",
                    "subscription": { "type": "allMids" }
                });
                let _ = upstream_ws.send(WsMessage::Text(all_mids_payload.to_string().into())).await;

                // 2. Multiplex Asset Orderbook feeds into the ingest circuit
                for asset in &asset_universe {
                    let orderbook_payload = serde_json::json!({
                        "method": "subscribe",
                        "subscription": { "type": "l2Book", "coin": asset }
                    });
                    let _ = upstream_ws.send(WsMessage::Text(orderbook_payload.to_string().into())).await;
                }
                println!("✅ Seamlessly streaming real-time metrics for {} markets", asset_universe.len());

                // Primary Network Processing Loop
                while let Some(Ok(ws_frame)) = upstream_ws.next().await {
                    if let WsMessage::Text(raw_payload) = ws_frame {
                        if let Ok(json_value) = serde_json::from_str::<Value>(&raw_payload) {
                            
                            // Extract information via the correct top-level channel identifier
                            if let Some(channel_name) = json_value.get("channel").and_then(|c| c.as_str()) {
                                if channel_name == "l2Book" {
                                    if let Some(asset_name) = json_value.get("data").and_then(|d| d.get("coin")).and_then(|c| c.as_str()) {
                                        let mut books_cache = state.orderbooks.write().await;
                                        books_cache.insert(asset_name.to_string(), json_value.clone());
                                    }
                                }
                                // Dispatch the frame straight down the internal high-speed routing pipelines
                                let _ = state.global_pipeline_tx.send(json_value);
                            }
                        }
                    }
                }
            }
            Err(err) => {
                eprintln!("❌ Core network link dropped: {:?}. Attempting connection recovery in 3s...", err);
                tokio::time::sleep(std::time::Duration::from_secs(3)).await;
            }
        }
    }
}

async fn fetch_production_universe() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let edge_response = client.post(HL_INFO_URL)
        .json(&serde_json::json!({"type": "meta"}))
        .send()
        .await?;

    let structural_meta: Value = edge_response.json().await?;
    let universe_array = structural_meta["universe"].as_array().ok_or("Malformed structural metadata format")?;

    Ok(universe_array.iter()
        .filter_map(|asset| asset["name"].as_str().map(|name_str| name_str.to_string()))
        .collect())
}

// ==================== PIPELINE MULTIPLEXER (Frontend Client Room) ====================
async fn ws_router_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |client_socket| execute_client_lifecycle(client_socket, state))
}

async fn execute_client_lifecycle(mut client_socket: axum::extract::ws::WebSocket, state: AppState) {
    println!("🔌 Local client interface pipe initialized");

    let mut local_pipeline_rx = state.global_pipeline_tx.subscribe();
    let mut tracked_assets: HashSet<String> = HashSet::new();

    loop {
        tokio::select! {
            // Intercept downstream commands from the UI
            Some(Ok(client_frame)) = client_socket.recv() => {
                if let axum::extract::ws::Message::Text(payload_text) = client_frame {
                    if let Ok(ui_command) = serde_json::from_str::<Value>(&payload_text) {
                        if ui_command["action"].as_str() == Some("subscribe") {
                            if let Some(target_coin) = ui_command["coin"].as_str() {
                                tracked_assets.insert(target_coin.to_string());
                                println!("📌 Client context locked tracking loop onto target ticker: {}", target_coin);
                            }
                        }
                    }
                }
            }

            // Route matching backend messages immediately down to the client layout layer
            Ok(incoming_exchange_frame) = local_pipeline_rx.recv() => {
                if let Some(channel) = incoming_exchange_frame.get("channel").and_then(|c| c.as_str()) {
                    let should_dispatch = match channel {
                        "allMids" => true, // Route global metrics directly to populate market lists
                        "l2Book" => {
                            if let Some(coin) = incoming_exchange_frame.get("data").and_then(|d| d.get("coin")).and_then(|c| c.as_str()) {
                                tracked_assets.contains(coin)
                            } else {
                                false
                            }
                        },
                        _ => false
                    };

                    if should_dispatch {
                        let serial_string = incoming_exchange_frame.to_string();
                        if client_socket.send(axum::extract::ws::Message::Text(serial_string.into())).await.is_err() {
                            break; // Gracefully terminate the connection if the socket breaks
                        }
                    }
                }
            }
        }
    }
    println!("❌ Local client dashboard channel disconnected");
}