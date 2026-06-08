"use client";
// hooks/useHyperliquidOrder.ts
// Manages order submission state and live account data.

import { useState, useEffect, useCallback } from "react";
import type { OrderRequest } from "@/app/api/hl/order/route";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Position {
  coin: string;
  szi: string;          // signed size (negative = short)
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  returnOnEquity: string;
  leverage: { type: string; value: number };
  liquidationPx: string | null;
}

export interface AccountState {
  address: string;
  accountValue: string;
  totalMarginUsed: string;
  withdrawable: string;
  positions: Position[];
  openOrders: any[];
}

export interface OrderResult {
  success: boolean;
  orderId?: number;
  walletAddress?: string;
  explorerUrl?: string;
  network?: string;
  error?: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHyperliquidOrder() {
  const [isPlacing, setIsPlacing] = useState(false);
  const [lastResult, setLastResult] = useState<OrderResult | null>(null);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Fetch account state once on mount and after each order
  const fetchAccount = useCallback(async () => {
    setLoadingAccount(true);
    try {
      const res = await fetch("/api/hl/account");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Normalize position data
      const positions: Position[] = (data.assetPositions ?? [])
        .filter((p: any) => parseFloat(p.position?.szi ?? "0") !== 0)
        .map((p: any) => ({
          coin: p.position.coin,
          szi: p.position.szi,
          entryPx: p.position.entryPx ?? "0",
          positionValue: p.position.positionValue ?? "0",
          unrealizedPnl: p.position.unrealizedPnl ?? "0",
          returnOnEquity: p.position.returnOnEquity ?? "0",
          leverage: p.position.leverage ?? { type: "cross", value: 1 },
          liquidationPx: p.position.liquidationPx ?? null,
        }));

      setAccount({
        address: data.address,
        accountValue: data.crossMarginSummary?.accountValue ?? "0",
        totalMarginUsed: data.crossMarginSummary?.totalMarginUsed ?? "0",
        withdrawable: data.crossMarginSummary?.withdrawable ?? "0",
        positions,
        openOrders: data.openOrders ?? [],
      });
    } catch (err) {
      console.error("[Account] Fetch failed:", err);
    } finally {
      setLoadingAccount(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
    // Refresh every 10 s
    const t = setInterval(fetchAccount, 10_000);
    return () => clearInterval(t);
  }, [fetchAccount]);

  // ── Place order ─────────────────────────────────────────────────────────────
  const placeOrder = useCallback(async (params: OrderRequest): Promise<OrderResult> => {
    setIsPlacing(true);
    setLastResult(null);

    try {
      const res = await fetch("/api/hl/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await res.json();

      const result: OrderResult = {
        success: res.ok && data.success,
        orderId: data.orderId,
        walletAddress: data.walletAddress,
        explorerUrl: data.explorerUrl,
        network: data.network,
        error: data.error,
      };

      setLastResult(result);

      // Refresh account state after order
      if (result.success) {
        setTimeout(fetchAccount, 1000);
      }

      return result;
    } catch (err: any) {
      const result: OrderResult = { success: false, error: err.message };
      setLastResult(result);
      return result;
    } finally {
      setIsPlacing(false);
    }
  }, [fetchAccount]);

  return {
    placeOrder,
    isPlacing,
    lastResult,
    account,
    loadingAccount,
    refreshAccount: fetchAccount,
  };
}