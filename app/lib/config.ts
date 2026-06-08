// app/lib/config.ts
// Centralized configuration for MochaTrade
// Switch between testnet and mainnet via NEXT_PUBLIC_HL_TESTNET env var

export const IS_TESTNET =
  process.env.NEXT_PUBLIC_HL_TESTNET === "true";

export const HL_CONFIG = {
  restUrl: IS_TESTNET
    ? "https://api.hyperliquid-testnet.xyz"
    : "https://api.hyperliquid.xyz",
  wsUrl: IS_TESTNET
    ? "wss://api.hyperliquid-testnet.xyz/ws"
    : "wss://api.hyperliquid.xyz/ws",
  explorerUrl: IS_TESTNET
    ? "https://app.hyperliquid-testnet.xyz"
    : "https://app.hyperliquid.xyz",
  /** EIP-712 chainId used by HL for signing (same for testnet/mainnet) */
  chainId: 1337,
  /** Human-readable chain name embedded in some HL signed messages */
  chainName: IS_TESTNET ? "Testnet" : "Mainnet",
} as const;

export const PROXY_CONFIG = {
  /** WebSocket URL of our Rust proxy */
  wsUrl:
    process.env.NEXT_PUBLIC_PROXY_WS_URL || "ws://localhost:3001/ws",
  /** REST base URL of our Rust proxy */
  restUrl:
    process.env.NEXT_PUBLIC_PROXY_REST_URL || "http://localhost:3001",
} as const;

// ─── Asset catalogue ──────────────────────────────────────────────────────────
// Hyperliquid assigns each perpetual a fixed integer index.
// These are the mainnet/testnet indices for common markets.

export const HL_ASSETS: Record<string, number> = {
  BTC: 0,
  ETH: 1,
  ARB: 2,
  BNB: 3,
  ATOM: 4,
  MATIC: 5,
  LTC: 6,
  AVAX: 7,
  SOL: 9,
  XRP: 12,
  DOGE: 13,
  INJ: 15,
  OP: 17,
  APT: 19,
  LINK: 20,
  SUI: 35,
  HYPE: 159,
};

export const AVAILABLE_MARKETS = [
  "BTC",
  "ETH",
  "SOL",
  "HYPE",
  "ARB",
  "BNB",
  "AVAX",
  "LINK",
  "SUI",
  "INJ",
];

/** Max leverage per asset (from HL exchange info – approximate values) */
export const MAX_LEVERAGE: Record<string, number> = {
  BTC: 50,
  ETH: 50,
  SOL: 20,
  HYPE: 10,
  ARB: 20,
  BNB: 20,
  AVAX: 20,
  LINK: 20,
  SUI: 10,
  INJ: 10,
};