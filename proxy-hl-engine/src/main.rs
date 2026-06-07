use axum::{
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::sync::{broadcast, mpsc, RwLock};
use tokio_tungstenite::tungstenite::Message as WsMessage;

const HL_MAINNET_WS: &str = "wss://api.hyperliquid.xyz/ws";

#[derive(Clone)]
struct AppState {
    // Tracks count of active subscribers per asset
    sub_registry: Arc<RwLock<HashMap<String, usize>>>,
    // Command channel to notify ingress worker of new subscription needs
    cmd_tx: mpsc::Sender<WsMessage>,
    pipeline_tx: broadcast::Sender<Value>,
}

#[tokio::main]
async fn main() {
    let (pipeline_tx, _) = broadcast::channel::<Value>(2048);
    let (cmd_tx, cmd_rx) = mpsc::channel(100);
    let sub_registry = Arc::new(RwLock::new(HashMap::new()));

    let state = AppState {
        sub_registry,
        cmd_tx,
        pipeline_tx,
    };

    tokio::spawn(ingress_data_worker(state.clone(), cmd_rx));

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .with_state(state)
        .layer(tower_http::cors::CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap();
    println!("🚀 Production Proxy Live @ :3001");
    axum::serve(listener, app).await.unwrap();
}

async fn ingress_data_worker(state: AppState, mut cmd_rx: mpsc::Receiver<WsMessage>) {
    loop {
        if let Ok((mut ws, _)) = tokio_tungstenite::connect_async(HL_MAINNET_WS).await {
            println!("✅ Connected to Hyperliquid");
            
            // Re-subscribe to all active assets on reconnection
            let current_assets: Vec<String> = {
                let registry = state.sub_registry.read().await;
                registry.keys().cloned().collect()
            };
            
            for asset in current_assets {
                let _ = ws.send(WsMessage::Text(json!({"method":"subscribe","subscription":{"type":"l2Book","coin":asset}}).to_string().into())).await;
            }

            loop {
                tokio::select! {
                    Some(cmd) = cmd_rx.recv() => { let _ = ws.send(cmd).await; }
                    Some(Ok(msg)) = ws.next() => {
                        if let WsMessage::Text(t) = msg {
                            if let Ok(val) = serde_json::from_str::<Value>(&t) {
                                let _ = state.pipeline_tx.send(val);
                            }
                        }
                    }
                }
            }
        }
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    }
}

async fn ws_handler(ws: WebSocketUpgrade, State(state): State<AppState>) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_client(socket, state))
}

async fn handle_client(socket: axum::extract::ws::WebSocket, state: AppState) {
    let (mut sink, mut stream) = socket.split();
    let mut rx = state.pipeline_tx.subscribe();
    let mut client_subs = Vec::new();

    while let Some(msg) = stream.next().await {
        if let Ok(axum::extract::ws::Message::Text(t)) = msg {
            if let Ok(v) = serde_json::from_str::<Value>(&t) {
                if v["action"] == "subscribe" {
                    let coin = v["coin"].as_str().unwrap().to_string();
                    client_subs.push(coin.clone());
                    
                    // Update registry and tell worker to sub upstream
                    state.sub_registry.write().await.entry(coin.clone()).and_modify(|e| *e += 1).or_insert(1);
                    let _ = state.cmd_tx.send(WsMessage::Text(json!({"method":"subscribe","subscription":{"type":"l2Book","coin":coin}}).to_string().into())).await;
                }
            }
        }
        
        // Broadcast listener loop inside client task
        tokio::select! {
            Ok(data) = rx.recv() => {
                let coin = data["data"]["coin"].as_str().unwrap_or("");
                if client_subs.contains(&coin.to_string()) || data["channel"] == "allMids" {
                    let _ = sink.send(axum::extract::ws::Message::Text(data.to_string().into())).await;
                }
            }
        }
    }
}