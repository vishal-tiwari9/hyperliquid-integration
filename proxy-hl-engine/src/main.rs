use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    response::IntoResponse,
    routing::get,
    Router,
};
use futures_util::{SinkExt, StreamExt};
use std::{net::SocketAddr, time::Duration};
use tokio::sync::{broadcast, mpsc};
use tokio::time::interval;

const HYPERLIQUID_TESTNET_WS: &str = "wss://api.hyperliquid-testnet.xyz/ws";
const BATCH_INTERVAL_MS: u64 = 60;

#[tokio::main]
async fn main() {
    // ------------------------------------------------------------------------
    // IPC SETUP (Inter-Process Communication Channels)
    // ------------------------------------------------------------------------
    
    // Channel 1: MPSC (Multi-Producer, Single Consumer) 
    // Worker 1 (Ingress) dumps data HERE. Worker 2 (Accumulator) reads from HERE.
    let (upstream_tx, upstream_rx) = mpsc::channel::<serde_json::Value>(10000);
    
    // Channel 2: Broadcast Channel
    // Worker 2 (Accumulator) dumps batched data HERE. Worker 3 (Distributor) forks this to everyone.
    let (client_tx, _) = broadcast::channel::<String>(100);

    // ------------------------------------------------------------------------
    // SPINNING UP THE WORKERS
    // ------------------------------------------------------------------------
    
    // Spawn Worker 1: Upstream Ingress Listener
    tokio::spawn(ingress_worker(upstream_tx));

    // Spawn Worker 2: The Accumulator / Batching Engine
    tokio::spawn(accumulator_worker(upstream_rx, client_tx.clone()));

    // Spawn Worker 3: Egress Broker (Axum Web Server Engine)
    let app = Router::new()
        .route("/ws", get(ws_handler))
        .layer(tower_http::cors::CorsLayer::permissive())
        .with_state(client_tx);

let addr = SocketAddr::from(([0, 0, 0, 0], 3001));
println!("🚀 Mochatrade Core Proxy listening on ALL interfaces at port 3000");
    
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// ============================================================================
// WORKER 1: INGRESS (The Intaker)
// ============================================================================
async fn ingress_worker(tx: mpsc::Sender<serde_json::Value>) {
    loop {
        println!("📡 Worker 1: Connecting to Hyperliquid Testnet Feed...");
        match tokio_tungstenite::connect_async(HYPERLIQUID_TESTNET_WS).await {
            Ok((mut ws_stream, _)) => {
                println!("✅ Worker 1: Connected to Hyperliquid successfully!");
                
                // Construct subscription payload for Bitcoin Orderbook (L2)
                let sub_payload = serde_json::json!({
                    "method": "subscribe",
                    "subscription": { "type": "l2Book", "coin": "BTC" }
                });
                
                if let Err(e) = ws_stream.send(tokio_tungstenite::tungstenite::Message::Text(sub_payload.to_string())).await {
                    eprintln!("❌ Subscription failed: {:?}", e);
                    continue;
                }

                // Continuously stream high frequency frames from the wire
                while let Some(Ok(msg)) = ws_stream.next().await {
                    if let tokio_tungstenite::tungstenite::Message::Text(text) = msg {
                        if let Ok(json_parsed) = serde_json::from_str::<serde_json::Value>(&text) {
                            // Shove raw JSON into the MPSC queue immediately to unblock network read loop
                            if let Err(_) = tx.try_send(json_parsed) {
                                // If buffer is full, backpressure handles it automatically
                            }
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("⚠️ Worker 1 Error: {:?}. Reconnecting in 3 seconds...", e);
                tokio::time::sleep(Duration::from_secs(3)).await;
            }
        }
    }
}

// ============================================================================
// WORKER 2: ACCUMULATOR (The Magic Buffer Engine)
// ============================================================================
async fn accumulator_worker(
    mut rx: mpsc::Receiver<serde_json::Value>,
    broadcast_tx: broadcast::Sender<String>,
) {
    // Set a strict tick timer (e.g., 60 milliseconds)
    let mut ticker = interval(Duration::from_millis(BATCH_INTERVAL_MS));
    
    // Allocate memory upfront for 1000 JSON values to avoid heavy execution-time reallocations
    let mut bucket: Vec<serde_json::Value> = Vec::with_capacity(1000);

    loop {
        // tokio::select lets us multiplex two async operations concurrently safely
        tokio::select! {
            // Case A: Worker 1 passed a raw message into our queue
            Some(raw_msg) = rx.recv() => {
                bucket.push(raw_msg);
            }
            
            // Case B: The 60ms timer ran out! Time to flush the data
            _ = ticker.tick() => {
                if !bucket.is_empty() {
                    // Turn our vector array of many messages into ONE single string message
                    if let Ok(serialized_batch) = serde_json::to_string(&bucket) {
                        // Broadcast the batched string packet to Worker 3's pipeline
                        let _ = broadcast_tx.send(serialized_batch);
                    }
                    // Empty out the array without dropping the allocated heap memory structure
                    bucket.clear();
                }
            }
        }
    }
}

// ============================================================================
// WORKER 3: EGRESS / DISTRIBUTOR (The Web Gateway Provider)
// ============================================================================
async fn ws_handler(
    ws: WebSocketUpgrade,
    axum::extract::State(client_tx): axum::extract::State<broadcast::Sender<String>>,
) -> impl IntoResponse {
    // Upgrade the regular HTTP request into a stateful persistent WebSocket pipe
    ws.on_upgrade(|socket| handle_frontend_client(socket, client_tx))
}

async fn handle_frontend_client(mut socket: WebSocket, client_tx: broadcast::Sender<String>) {
    // Subscribe directly to Worker 2's Broadcast channel stream output
    let mut rx = client_tx.subscribe();
    println!("🔌 Worker 3: Next.js Frontend UI connected!");

    // Whenever a batch is pushed out of Worker 2, instantly pass it down the wire to the frontend
    while let Ok(batched_msg) = rx.recv().await {
        if socket.send(Message::Text(batched_msg)).await.is_err() {
            // Disconnect caught if client closes the tab
            break;
        }
    }
    println!("❌ Worker 3: Next.js Frontend UI disconnected.");
}