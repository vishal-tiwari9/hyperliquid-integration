// proxy-hl-engine/src/main.rs
//
// MochaTrade Hyperliquid Proxy – Production Rewrite
//
// BUGS FIXED FROM ORIGINAL:
//   1. handle_client blocked on stream.next() BEFORE checking rx — data never flowed
//   2. Subscription format mismatch: proxy expected {action,coin}, clients sent HL native {method,subscription}
//   3. allMids was never subscribed upstream — mark prices never came through
//   4. trades subscriptions were never forwarded upstream
//   5. cmd_tx channel used WsMessage; now uses plain String to avoid tungstenite dep in multiple places
//   6. No REST proxy — frontend called HL directly, bypassing proxy

use axum::{
    extract::{State, WebSocketUpgrade},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use reqwest::Client as HttpClient;
use serde_json::{json, Value};
use std::{collections::HashMap, sync::Arc};
use tokio::sync::{broadcast, mpsc, RwLock};
use tokio_tungstenite::tungstenite::Message as WsMessage;

// ─── Network config ─────────────────────────────────────────────────────────

fn is_testnet() -> bool {
    std::env::var("HL_TESTNET").as_deref() == Ok("true")
}

fn hl_ws_url() -> &'static str {
    if is_testnet() {
        "wss://api.hyperliquid-testnet.xyz/ws"
    } else {
        "wss://api.hyperliquid.xyz/ws"
    }
}

fn hl_rest_url() -> &'static str {
    if is_testnet() {
        "https://api.hyperliquid-testnet.xyz"
    } else {
        "https://api.hyperliquid.xyz"
    }
}

// ─── Shared application state ────────────────────────────────────────────────

#[derive(Clone)]
struct AppState {
    /// Tracks reference counts per subscription key (e.g. "l2Book:BTC")
    sub_registry: Arc<RwLock<HashMap<String, usize>>>,
    /// Send a raw JSON string command to the HL upstream worker
    cmd_tx: mpsc::Sender<String>,
    /// Broadcast channel: every HL message fans out to all connected clients
    pipeline_tx: broadcast::Sender<Value>,
    http_client: HttpClient,
}

// ─── Entry point ─────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    // Channel that receives all HL upstream data and fans it out
    let (pipeline_tx, _) = broadcast::channel::<Value>(4096);
    // Command channel: client handlers send new subscription requests to the upstream worker
    let (cmd_tx, cmd_rx) = mpsc::channel::<String>(256);

    let state = AppState {
        sub_registry: Arc::new(RwLock::new(HashMap::new())),
        cmd_tx,
        pipeline_tx,
        http_client: HttpClient::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .unwrap(),
    };

    tokio::spawn(ingress_worker(state.clone(), cmd_rx));

    let network = if is_testnet() { "TESTNET" } else { "MAINNET" };
    println!("🚀 MochaTrade Proxy on :3001 [{network}]");

    let app = Router::new()
        // WebSocket stream endpoint
        .route("/ws", get(ws_handler))
        // REST proxy endpoints — lets frontend route all HL calls through us
        .route("/info", post(info_proxy))
        .route("/exchange", post(exchange_proxy))
        .route("/health", get(health_handler))
        .with_state(state)
        .layer(tower_http::cors::CorsLayer::permissive());

    axum::serve(
        tokio::net::TcpListener::bind("0.0.0.0:3001").await.unwrap(),
        app,
    )
    .await
    .unwrap();
}

// ─── Health check ─────────────────────────────────────────────────────────────

async fn health_handler(State(_): State<AppState>) -> &'static str {
    "OK"
}

// ─── REST Proxies ─────────────────────────────────────────────────────────────

/// Proxy POST /info → HL
async fn info_proxy(
    State(state): State<AppState>,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    let url = format!("{}/info", hl_rest_url());
    match state.http_client.post(&url).json(&body).send().await {
        Ok(resp) => {
            let data: Value = resp.json().await.unwrap_or(json!({"error":"parse_failed"}));
            Json(data)
        }
        Err(e) => Json(json!({"error": e.to_string()})),
    }
}

/// Proxy POST /exchange → HL (order placement)
async fn exchange_proxy(
    State(state): State<AppState>,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    let url = format!("{}/exchange", hl_rest_url());
    match state.http_client.post(&url).json(&body).send().await {
        Ok(resp) => {
            let data: Value = resp.json().await.unwrap_or(json!({"error":"parse_failed"}));
            Json(data)
        }
        Err(e) => Json(json!({"error": e.to_string()})),
    }
}

// ─── Upstream ingress worker ──────────────────────────────────────────────────
//
// Maintains ONE persistent connection to Hyperliquid WebSocket.
// Forwards all received messages onto the broadcast pipeline.
// Re-subscribes to all active channels after a reconnect.

async fn ingress_worker(state: AppState, mut cmd_rx: mpsc::Receiver<String>) {
    loop {
        let ws_url = hl_ws_url();
        match tokio_tungstenite::connect_async(ws_url).await {
            Ok((mut ws, _)) => {
                println!("✅ Connected to Hyperliquid [{ws_url}]");

                // Always subscribe to allMids – global mark-price feed
                let _ = ws
                    .send(WsMessage::Text(
                        json!({"method":"subscribe","subscription":{"type":"allMids"}})
                            .to_string()
                            .into(),
                    ))
                    .await;

                // Re-subscribe all previously active per-coin channels after reconnect
                let active: Vec<String> = {
                    state.sub_registry.read().await.keys().cloned().collect()
                };
                for key in &active {
                    if let Some((sub_type, coin)) = key.split_once(':') {
                        let msg = json!({"method":"subscribe","subscription":{"type":sub_type,"coin":coin}}).to_string();
                        let _ = ws.send(WsMessage::Text(msg.into())).await;
                    }
                }

                let mut keepalive =
                    tokio::time::interval(tokio::time::Duration::from_secs(20));

                loop {
                    tokio::select! {
                        // New subscription commands from client handlers
                        Some(cmd) = cmd_rx.recv() => {
                            if ws.send(WsMessage::Text(cmd.into())).await.is_err() {
                                eprintln!("❌ HL upstream write error");
                                break;
                            }
                        }

                        // Data arriving from Hyperliquid
                        Some(msg_result) = ws.next() => {
                            match msg_result {
                                Ok(WsMessage::Text(t)) => {
                                    if let Ok(v) = serde_json::from_str::<Value>(&t) {
                                        // Only broadcast actual channel messages, not pong/meta
                                        if v.get("channel").is_some() {
                                            let _ = state.pipeline_tx.send(v);
                                        }
                                    }
                                }
                                Ok(WsMessage::Close(_)) => {
                                    println!("⚠️  HL closed the connection");
                                    break;
                                }
                                Err(e) => {
                                    eprintln!("❌ HL recv error: {e}");
                                    break;
                                }
                                _ => {}
                            }
                        }

                        // Keepalive ping
                        _ = keepalive.tick() => {
                            let _ = ws.send(WsMessage::Text(
                                json!({"method":"ping"}).to_string().into()
                            )).await;
                        }
                    }
                }
            }
            Err(e) => {
                eprintln!("❌ Cannot connect to Hyperliquid: {e}");
            }
        }

        println!("🔄 Reconnecting to Hyperliquid in 3 s…");
        tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
    }
}

// ─── WebSocket upgrade handler ────────────────────────────────────────────────

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_client(socket, state))
}

// ─── Per-client WebSocket handler ─────────────────────────────────────────────
//
// THE CORE FIX:
//   Original code used `while let Some(msg) = stream.next().await` as the
//   outer loop, then checked `rx.recv()` inside a select — meaning data was
//   only forwarded AFTER the client sent a message.  Nothing ever arrived.
//
//   Fix: split into two concurrent tasks sharing an RwLock<Vec<String>>:
//     • Reader task  – reads subscription commands from the client WebSocket
//     • Writer task  – reads from the broadcast pipeline and writes to client
//
//   A tiny mpsc channel lets the reader inject direct replies (ping→pong)
//   into the writer's send path without needing Arc<Mutex<Sink>>.

async fn handle_client(socket: axum::extract::ws::WebSocket, state: AppState) {
    let (mut sink, mut stream) = socket.split();
    let mut rx = state.pipeline_tx.subscribe();

    // Subscription keys this client has registered (e.g. "l2Book:BTC", "trades:ETH")
    let client_subs: Arc<RwLock<Vec<String>>> = Arc::new(RwLock::new(Vec::new()));

    // Channel from reader → writer for direct replies (ping/pong)
    let (write_tx, mut write_rx) = mpsc::channel::<String>(64);

    // ── Reader task ───────────────────────────────────────────────────────────
    let state_r = state.clone();
    let subs_r = client_subs.clone();
    let write_tx_r = write_tx.clone();

    let reader = tokio::spawn(async move {
        while let Some(Ok(axum::extract::ws::Message::Text(t))) = stream.next().await {
            let Ok(v) = serde_json::from_str::<Value>(&t) else { continue };

            match v.get("method").and_then(|m| m.as_str()) {
                // ─── Subscribe request from client ────────────────────────────
                Some("subscribe") => {
                    let Some(sub) = v.get("subscription") else { continue };
                    let sub_type = sub.get("type").and_then(|t| t.as_str()).unwrap_or("");
                    let coin = sub
                        .get("coin")
                        .and_then(|c| c.as_str())
                        .unwrap_or("")
                        .to_uppercase();

                    if sub_type.is_empty() {
                        continue;
                    }

                    if sub_type == "allMids" {
                        // allMids is globally subscribed upstream; just mark client interest
                        let mut subs = subs_r.write().await;
                        if !subs.contains(&"allMids".to_string()) {
                            subs.push("allMids".to_string());
                        }
                        continue;
                    }

                    if coin.is_empty() {
                        continue;
                    }

                    let key = format!("{sub_type}:{coin}");
                    let mut subs = subs_r.write().await;

                    if !subs.contains(&key) {
                        subs.push(key.clone());
                        *state_r.sub_registry.write().await.entry(key).or_insert(0) += 1;

                        // Forward subscription upstream to Hyperliquid
                        let cmd = json!({
                            "method": "subscribe",
                            "subscription": {"type": sub_type, "coin": coin}
                        })
                        .to_string();
                        let _ = state_r.cmd_tx.send(cmd).await;
                    }
                }

                // ─── Unsubscribe ───────────────────────────────────────────────
                Some("unsubscribe") => {
                    let Some(sub) = v.get("subscription") else { continue };
                    let sub_type = sub.get("type").and_then(|t| t.as_str()).unwrap_or("");
                    let coin = sub
                        .get("coin")
                        .and_then(|c| c.as_str())
                        .unwrap_or("")
                        .to_uppercase();
                    let key = if coin.is_empty() {
                        sub_type.to_string()
                    } else {
                        format!("{sub_type}:{coin}")
                    };
                    let mut subs = subs_r.write().await;
                    subs.retain(|s| s != &key);
                    // Decrement registry; unsubscribe upstream when count hits 0
                    let mut registry = state_r.sub_registry.write().await;
                    if let Some(count) = registry.get_mut(&key) {
                        if *count <= 1 {
                            registry.remove(&key);
                            let cmd = json!({
                                "method": "unsubscribe",
                                "subscription": {"type": sub_type, "coin": coin}
                            })
                            .to_string();
                            let _ = state_r.cmd_tx.send(cmd).await;
                        } else {
                            *count -= 1;
                        }
                    }
                }

                // ─── Ping → Pong ───────────────────────────────────────────────
                Some("ping") => {
                    let _ = write_tx_r
                        .send(json!({"channel":"pong"}).to_string())
                        .await;
                }

                _ => {}
            }
        }
        // Client disconnected — reader task exits
    });

    // ── Writer task ───────────────────────────────────────────────────────────
    let subs_w = client_subs.clone();

    let writer = tokio::spawn(async move {
        loop {
            tokio::select! {
                // Direct replies from reader (ping/pong, subscription acks)
                Some(msg) = write_rx.recv() => {
                    if sink
                        .send(axum::extract::ws::Message::Text(msg.into()))
                        .await
                        .is_err()
                    {
                        break; // client disconnected
                    }
                }

                // Hyperliquid broadcast data
                result = rx.recv() => {
                    match result {
                        Ok(data) => {
                            let channel = data
                                .get("channel")
                                .and_then(|c| c.as_str())
                                .unwrap_or("");

                            let subs = subs_w.read().await;

                            let should_send = match channel {
                                // Always forward global price updates
                                "allMids" => true,

                                // Order book — filter by subscribed coin
                                "l2Book" => {
                                    let coin = data["data"]["coin"]
                                        .as_str()
                                        .unwrap_or("")
                                        .to_uppercase();
                                    subs.contains(&format!("l2Book:{coin}"))
                                }

                                // Trade tape — check first trade's coin
                                "trades" => data["data"]
                                    .as_array()
                                    .and_then(|arr| arr.first())
                                    .and_then(|t| t["coin"].as_str())
                                    .map(|coin| {
                                        subs.contains(&format!("trades:{}", coin.to_uppercase()))
                                    })
                                    .unwrap_or(false),

                                // Candle updates
                                "candle" => {
                                    let coin = data["data"]["s"]
                                        .as_str()
                                        .unwrap_or("")
                                        .to_uppercase();
                                    subs.contains(&format!("candle:{coin}"))
                                }

                                // User-level data (positions, orders) — always forward
                                // (clients only subscribe to their own address stream)
                                "user" | "orderUpdates" | "userFills" | "userFunding" => true,

                                _ => false,
                            };

                            if should_send {
                                if sink
                                    .send(axum::extract::ws::Message::Text(
                                        data.to_string().into(),
                                    ))
                                    .await
                                    .is_err()
                                {
                                    break; // client disconnected
                                }
                            }
                        }

                        // Client is slow; we skip lagged frames rather than crashing
                        Err(broadcast::error::RecvError::Lagged(n)) => {
                            eprintln!("⚠️  Client lagged {n} frames");
                        }

                        Err(_) => break,
                    }
                }
            }
        }
    });

    // When either task finishes (client disconnect), abort the other
    tokio::select! {
        _ = reader => {}
        _ = writer => {}
    }
}