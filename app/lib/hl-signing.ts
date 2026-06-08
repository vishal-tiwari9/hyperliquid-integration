// app/lib/hl-signing.ts
//
// Implements Hyperliquid's action-hash + personal-sign scheme.
// This MUST match the Python SDK's signing.py exactly, or orders will be rejected.
//
// Algorithm:
//   hash = keccak256( 0x01 || nonce_be8 || 0x00 || msgpack(action) )
//   sig  = eth_sign(hash)   ← personal_sign: prepends "\x19Ethereum Signed Message:\n32"

import { encode as msgpackEncode } from "@msgpack/msgpack";
import { keccak256, getBytes } from "ethers";

/**
 * Compute the HL action hash that must be signed.
 * @param action  - The plain-JS action object (will be msgpack-encoded)
 * @param nonce   - Millisecond timestamp (Date.now())
 * @param vaultAddress - Optional vault/sub-account address (null = primary)
 */
export function computeActionHash(
  action: object,
  nonce: number,
  vaultAddress: string | null = null
): Uint8Array {
  const msgpackBytes = msgpackEncode(action);

  // 8-byte big-endian nonce
  const nonceBuf = Buffer.alloc(8);
  nonceBuf.writeBigUInt64BE(BigInt(nonce), 0);

  // Vault component: 0x00 = no vault, 0x01 + 20-byte address = vault
  const vaultComponent =
    vaultAddress && vaultAddress !== "0x0000000000000000000000000000000000000000"
      ? Buffer.concat([
          Buffer.from([0x01]),
          Buffer.from(vaultAddress.toLowerCase().replace("0x", ""), "hex"),
        ])
      : Buffer.from([0x00]);

  const combined = Buffer.concat([
    Buffer.from([0x01]), // source byte
    nonceBuf,
    vaultComponent,
    Buffer.from(msgpackBytes),
  ]);

  // Return as raw bytes (ethers.signMessage will add the personal_sign prefix)
  return getBytes(keccak256(combined));
}

/**
 * Split an ethers hex signature into HL {r, s, v} format.
 */
export function parseSignature(sig: string): { r: string; s: string; v: number } {
  const clean = sig.startsWith("0x") ? sig.slice(2) : sig;
  return {
    r: "0x" + clean.slice(0, 64),
    s: "0x" + clean.slice(64, 128),
    v: parseInt(clean.slice(128, 130), 16),
  };
}

/**
 * Convert a JS number to HL wire string format.
 * HL expects price/size as strings with no trailing zeros.
 *   floatToWire(103000.5) → "103000.5"
 *   floatToWire(0.001)    → "0.001"
 */
export function floatToWire(x: number): string {
  if (x === 0) return "0";
  const rounded = Math.round(x * 1e8) / 1e8;
  // Use fixed notation and strip trailing zeros
  return rounded.toFixed(8).replace(/\.?0+$/, "");
}

/**
 * Build the HL order action object (ready to sign + POST).
 */
export interface OrderParams {
  assetIndex: number;
  isBuy: boolean;
  /** Pass 0 for market orders */
  limitPx: number;
  sz: number;
  reduceOnly?: boolean;
  /** "market" | "limit" | "ioc" */
  orderType: "market" | "limit" | "ioc";
  /** Optional 16-byte client order ID (hex string) */
  cloid?: string;
}

export function buildOrderAction(orders: OrderParams[]) {
  return {
    type: "order",
    orders: orders.map((o) => ({
      a: o.assetIndex,
      b: o.isBuy,
      p: o.orderType === "market" ? "0" : floatToWire(o.limitPx),
      s: floatToWire(o.sz),
      r: o.reduceOnly ?? false,
      t: {
        limit: {
          tif: o.orderType === "market" ? "Ioc" : o.orderType === "ioc" ? "Ioc" : "Gtc",
        },
      },
      ...(o.cloid ? { c: o.cloid } : {}),
    })),
    grouping: "na",
  };
}

/**
 * Build a leverage-update action.
 */
export function buildLeverageAction(assetIndex: number, leverage: number, isCross = true) {
  return {
    type: "updateLeverage",
    asset: assetIndex,
    isCross,
    leverage,
  };
}