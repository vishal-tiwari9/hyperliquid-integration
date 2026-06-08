// app/app/api/hl/order/route.ts
//
// Server-side order placement for Hyperliquid.
//
// TESTNET PHASE: Signs with a server-side wallet stored in HL_TESTNET_PRIVATE_KEY.
// All orders go to the same testnet wallet address.
// Users see real HL testnet order execution.
//
// MAINNET UPGRADE PATH: Move signing to client (Privy embedded wallet +
// useSignMessage), send the pre-signed payload here or directly to HL.

import { NextRequest, NextResponse } from "next/server";
import { Wallet } from "ethers";
import {
  computeActionHash,
  parseSignature,
  buildOrderAction,
  buildLeverageAction,
} from "@/lib/hl-signing";
import { HL_CONFIG, HL_ASSETS, IS_TESTNET } from "@/lib/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hlPost(path: string, body: object) {
  const url = `${HL_CONFIG.restUrl}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HL ${path} returned ${res.status}: ${text}`);
  }
  return res.json();
}

async function signAndSubmit(
  action: object,
  nonce: number,
  privateKey: string
): Promise<{ result: any; wallet: string }> {
  const wallet = new Wallet(privateKey);
  const hash = computeActionHash(action, nonce);
  const rawSig = await wallet.signMessage(hash);
  const sig = parseSignature(rawSig);

  const result = await hlPost("/exchange", { action, nonce, signature: sig });
  return { result, wallet: wallet.address };
}

// ─── Request / response types ─────────────────────────────────────────────────

export interface OrderRequest {
  coin: string;
  side: "buy" | "sell";
  orderType: "market" | "limit";
  size: string;          // string to avoid float precision issues
  price?: string;        // required for limit orders
  leverage?: number;     // 1–50, default 1
  reduceOnly?: boolean;
  tp?: string;           // take-profit price
  sl?: string;           // stop-loss price
}

// ─── POST /api/hl/order ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── Validate env ──────────────────────────────────────────────────────────
    const privateKey = process.env.HL_TESTNET_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json(
        { error: "HL_TESTNET_PRIVATE_KEY not set in env" },
        { status: 500 }
      );
    }

    const body: OrderRequest = await req.json();
    const { coin, side, orderType, size, price, leverage, reduceOnly, tp, sl } = body;

    // ── Validate inputs ───────────────────────────────────────────────────────
    const assetIndex = HL_ASSETS[coin.toUpperCase()];
    if (assetIndex === undefined) {
      return NextResponse.json({ error: `Unknown asset: ${coin}` }, { status: 400 });
    }

    const sz = parseFloat(size);
    if (isNaN(sz) || sz <= 0) {
      return NextResponse.json({ error: "Invalid size" }, { status: 400 });
    }

    if (orderType === "limit" && (!price || parseFloat(price) <= 0)) {
      return NextResponse.json({ error: "Limit orders require a valid price" }, { status: 400 });
    }

    const isBuy = side === "buy";
    const px = orderType === "limit" ? parseFloat(price!) : 0;
    const lev = Math.min(Math.max(leverage ?? 1, 1), 50);

    // ── Step 1: Set leverage ───────────────────────────────────────────────────
    if (lev > 1) {
      const levNonce = Date.now();
      const levAction = buildLeverageAction(assetIndex, lev, true /* cross */);
      await signAndSubmit(levAction, levNonce, privateKey).catch((e) =>
        console.warn("Leverage update warning (non-fatal):", e.message)
      );
      // Small delay to ensure leverage is applied before order
      await new Promise((r) => setTimeout(r, 100));
    }

    // ── Step 2: Place the primary order ───────────────────────────────────────
    const nonce = Date.now();
    const action = buildOrderAction([
      {
        assetIndex,
        isBuy,
        limitPx: px,
        sz,
        reduceOnly: reduceOnly ?? false,
        orderType,
      },
    ]);

    const { result, wallet: walletAddress } = await signAndSubmit(action, nonce, privateKey);

    // ── Step 3: Place TP/SL orders if provided ────────────────────────────────
    const tpslResults: any[] = [];

    if (tp && parseFloat(tp) > 0) {
      try {
        const tpNonce = Date.now() + 1;
        const tpAction = buildOrderAction([
          {
            assetIndex,
            isBuy: !isBuy,       // opposite side
            limitPx: parseFloat(tp),
            sz,
            reduceOnly: true,    // TP is always reduce-only
            orderType: "limit",
          },
        ]);
        const tpResult = await signAndSubmit(tpAction, tpNonce, privateKey);
        tpslResults.push({ type: "tp", ...tpResult.result });
      } catch (e: any) {
        console.warn("TP order failed (non-fatal):", e.message);
      }
    }

    if (sl && parseFloat(sl) > 0) {
      try {
        const slNonce = Date.now() + 2;
        // SL uses a trigger (stop) order — IOC at market when trigger hit
        const slAction = buildOrderAction([
          {
            assetIndex,
            isBuy: !isBuy,
            limitPx: parseFloat(sl),
            sz,
            reduceOnly: true,
            orderType: "market", // IOC trigger
          },
        ]);
        const slResult = await signAndSubmit(slAction, slNonce, privateKey);
        tpslResults.push({ type: "sl", ...slResult.result });
      } catch (e: any) {
        console.warn("SL order failed (non-fatal):", e.message);
      }
    }

    // ── Extract HL order ID from result ───────────────────────────────────────
    const statuses = result?.response?.data?.statuses ?? [];
    const orderId = statuses[0]?.resting?.oid ?? statuses[0]?.filled?.oid ?? null;

    return NextResponse.json({
      success: true,
      orderId,
      walletAddress,
      explorerUrl: `${HL_CONFIG.explorerUrl}/trade/${walletAddress}`,
      network: IS_TESTNET ? "testnet" : "mainnet",
      result,
      tpsl: tpslResults,
    });
  } catch (error: any) {
    console.error("[Order API] Error:", error);
    return NextResponse.json(
      { error: error.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}