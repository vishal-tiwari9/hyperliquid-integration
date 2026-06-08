// app/app/api/hl/account/route.ts
// Fetches account state (balances + open positions) from Hyperliquid.

import { NextRequest, NextResponse } from "next/server";
import { Wallet } from "ethers";
import { HL_CONFIG } from "@/lib/config";

export async function GET(req: NextRequest) {
  try {
    const privateKey = process.env.HL_TESTNET_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: "HL_TESTNET_PRIVATE_KEY not set" }, { status: 500 });
    }

    const wallet = new Wallet(privateKey);
    const address = wallet.address;

    // Fetch clearinghouse state (balances + positions)
    const [stateRes, openOrdersRes] = await Promise.all([
      fetch(`${HL_CONFIG.restUrl}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "clearinghouseState", user: address }),
      }),
      fetch(`${HL_CONFIG.restUrl}/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "openOrders", user: address }),
      }),
    ]);

    const state = await stateRes.json();
    const openOrders = await openOrdersRes.json();

    return NextResponse.json({
      address,
      crossMarginSummary: state?.crossMarginSummary,
      marginSummary: state?.marginSummary,
      assetPositions: state?.assetPositions ?? [],
      openOrders: openOrders ?? [],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}