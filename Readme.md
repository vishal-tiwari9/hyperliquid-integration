# Hyperliquid—Integrations : Non-Custodial Perpetual Futures Trading Platform

A high-performance, low-latency, asynchronous non-custodial trading interface engineered for **Hyperliquid** perpetual contracts with support for up to 50× leverage. This system couples a **Next.js 14** enterprise frontend with an optimized **Rust Axum** proxy layer to ensure ultra-low latency market data routing, persistent upstream connection pooling, instant fiat-to-crypto rails (INR → USDC via UPI), and isolated web3 authentication powered by **Privy**.

---

## 🔑 Key Architectural Features & Tech Stack

### 🛠️ Tech Stack Used

* **Frontend Architecture:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer Motion
* **Authentication & Cryptographic Wallet Layer:** Privy (Decoupled Email/Social OAuth with secure embedded non-custodial web3 wallets)
* **Backend Proxy Engine:** Rust (Stable, 2021 Edition) powered by `axum` and `tokio` multi-threaded async runtime
* **Network Protocol Layer:** `tokio-tungstenite` (Asynchronous streaming upstream WebSocket connection loops over native TLS)
* **Concurrence & Distribution:** Tokio broadcast channels (`broadcast::channel`) for highly scalable, zero-allocation down-stream pub/sub delivery

### 📡 Design Pattern: Persistent Upstream + Smart Broadcast Architecture

The proxy infrastructure is built using a decoupled, single-connection streaming architecture designed to eliminate redundant network bottlenecks.

* **Upstream Connection Pooling:** Instead of forcing each frontend client to maintain separate stateful sockets to the exchange, the Rust proxy spins up a solitary, highly resilient upstream WebSocket client directly targeting the Hyperliquid API matching engine.
* **Reference-Counted Subscription Registry:** The engine tracks active channel dependencies (`l2Book`, `trades`, `allMids`) using atomic subscription bookkeeping. Upstream subscription or unsubscription payloads are only dispatched when local reference counts transition from $0 \to 1$ or $1 \to 0$.
* **Zero-Copy Broadcasting:** Incoming market data payloads are parsed once, packaged into structural variants, and broadcasted instantly to hundreds of concurrent client threads via memory-efficient broadcast pipes, mitigating network socket exhaustion and data race overhead.

---

## 📂 Repository Layout & File Descriptions

```
MochaTrade/
├── app/                      # Next.js App Router 
├── packages                   # Data base and ORM
├── proxy-hl-engine/          # High-Performance Rust Hyperliquid Proxy Server
│   ├── src/
│   │   └── main.rs           # Multi-threaded Core, Connection Lifecycle & Proxy Router
│   └── Cargo.toml            # Manifest dependencies & heavy compiler optimizations
├── README.md                 # System Architectural Documentation
└── .env.example              # Decentralized environment blueprint templates

```

### 1. `app/page.tsx` — The Landing Page Orchestrator

Integrates Privy authentication state contexts with stateful reactive routing, evaluating active non-custodial sessions to instantly switch layout elements and dynamic operational calls between onboarding and account dashboarding.

### 3. `proxy-hl-engine/src/main.rs` — The Hyperliquid Proxy Core

The centralized network proxy engine managing systemic connection lifecycles:

* Spawns independent concurrent Tokio reader/writer sub-tasks per connected user interface.
* Employs automated exponential-backoff retry schedulers to handle upstream socket dropouts and automatically rebuilds active atomic subscription state trees.
* Provides deterministic transparent forwarding layers for `/info` and `/exchange` JSON REST invocations, applying unified access control policies.

---

## ⚙️ How It Works (End-to-End Data Flow)

```
[Frontend Clients (Next.js + Privy)]
         ↓ ↑ (WebSocket Duplex + REST Pipelines)
[MochaTrade Rust Proxy (:3001)]
         ├── Reader Task (Per-Client Stream Aggregator)
         ├── Writer Task (Per-Client Multiplex Filtered Broadcast)
         └── Ingress Worker (Single Persistent Upstream Link)
                 ↓ ↑ (Secure Websocket Protocol over TLS)
[Hyperliquid API Infrastructure (Mainnet / Testnet)]

```

1. **Client Handshake:** Client frontends initialize authenticated sessions and register specific topic streams (e.g., orderbook layers, active trades) through the Rust proxy port.
2. **Subscription Management:** The proxy checks if the requested stream is already active inside its atomic ledger. If the stream is novel, the single upstream worker sends an explicit subscribe event to Hyperliquid; otherwise, the client is seamlessly attached to the existing stream.
3. **Optimized Demultiplexing:** Downstream data packets hit the centralized `Ingress Worker`, which routes them directly into memory broadcast loops to serve data payloads efficiently to all downstream listeners.
4. **Isolated Transaction Execution:** Cryptographic transaction instructions, trade execution commands, and non-sensitive market state polling bypass standard broadcast paths—routing directly through the secure REST client wrapper to guard client security.

---

## 🛠️ Installation & Execution Guide

### Prerequisites

* **Node.js:** Runtime environment version 18+ along with package managers (`npm`/`pnpm`).
* **Rust Toolchain:** Stable compiler configuration toolchain (`cargo` suite).
* **Privy Integration:** A validated Privy Application identifier obtained from the Privy developer console.

### Clone & Dependencies Resolution

```bash
git clone <github.com/vishal-tiwari9/hyperliquid-integration

```


### Production Proxy Build & Execution

Navigate to the proxy micro-service path. Build and execute with aggressive graph-level compiler optimizations (`opt-level = 3`) to bypass debug bounds-checks:

```bash
cd proxy-hl-engine

# To deploy on Hyperliquid Testnet environment
HL_TESTNET=true cargo run --release

# To deploy on Hyperliquid Mainnet environment
cargo run --release

```

The high-performance network daemon initiates listeners binding cleanly on protocol state `http://0.0.0.0:3001`.

---

## 🌐 Environment Variables Configuration

Ensure your configuration matrices are populated within local `.env` files prior to starting initialization tasks:

### Frontend Layer Configurations

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
NEXT_PUBLIC_PROXY_WS_URL=ws://localhost:3001/ws
NEXT_PUBLIC_PROXY_API_URL=http://localhost:3001

```

### Backend Proxy Layer Configurations

```env
HL_TESTNET=true # Set to false or omit when deploying directly to production mainnet environments

```

---

## 🧠 Key Structural Issues Addressed

* **Latency Variance Elimination:** Restructures chaotic browser-based direct connections into an ordered, single persistent pipeline backend loop to drop network handshake penalties.
* **Upstream Subscription Optimization:** Controls multi-client streaming waste by implementing an allocation reference-counter, stopping redundant duplicate streams at the exchange level.
* **Network Fault Self-Healing:** Mitigates random connection terminations using active heartbeat tracking and automated session state recovery.
* **Security Control Boundary:** Establishes a hardened middleware layer, shielding raw wallet signing environments and keeping critical configuration bounds secure.

---

## 🤝 Contribution Guidelines

Contributions are highly valued! To implement performance updates, refactor the orderbook processing architecture, or modify user-facing UI layouts, please follow this pipeline:

1. **Fork** the repository resource.
2. Spin up an explicit feature branch (`git checkout -b feature/AmazingPerformanceUpgrade`).
3. Commit atomic code patches accompanied by highly descriptive logging logs (`git commit -m 'feat: refactor proxy subscription broadcast channels'`).
4. Push your localized branch upstream (`git push origin feature/AmazingPerformanceUpgrade`).
5. Open a **Pull Request** detailing changes, ensuring code verification tests pass completely under the `cargo clippy` and project linting rules.

---
