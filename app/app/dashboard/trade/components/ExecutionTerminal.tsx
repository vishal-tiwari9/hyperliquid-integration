"use client";
// app/dashboard/trade/components/ExecutionTerminal.tsx
// Full rewrite: real order placement, wallet status, leverage slider, TP/SL.

import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useHyperliquidOrder } from "@/hooks/useHyperliquidOrder";
import { MAX_LEVERAGE } from "@/lib/config";
import { ExternalLink, Loader2, CheckCircle2, AlertTriangle, Wallet } from "lucide-react";

interface ExecutionTerminalProps {
  coin: string;
  markPrice: number;
}

export const ExecutionTerminal: React.FC<ExecutionTerminalProps> = ({
  coin,
  markPrice,
}) => {
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  const { placeOrder, isPlacing, lastResult, account, loadingAccount } =
    useHyperliquidOrder();

  // ─── Order form state ────────────────────────────────────────────────────
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [marginMode, setMarginMode] = useState<"cross" | "isolated">("cross");
  const [sizeInput, setSizeInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [tpInput, setTpInput] = useState("");
  const [slInput, setSlInput] = useState("");
  const [showTpSl, setShowTpSl] = useState(false);

  const maxLev = MAX_LEVERAGE[coin] ?? 20;

  // Pre-fill limit price from mark price
  useEffect(() => {
    if (orderType === "limit" && markPrice > 0 && !priceInput) {
      setPriceInput(markPrice.toFixed(1));
    }
  }, [orderType, markPrice]);

  // ─── Derived values ──────────────────────────────────────────────────────
  const sizeNum = parseFloat(sizeInput) || 0;
  const priceNum = orderType === "market" ? markPrice : parseFloat(priceInput) || markPrice;
  const notional = sizeNum * priceNum;
  const margin = leverage > 0 ? notional / leverage : notional;
  const availableBalance = parseFloat(account?.withdrawable ?? "0");

  // ─── Submit handler ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!sizeInput || sizeNum <= 0) return;

    const result = await placeOrder({
      coin,
      side,
      orderType,
      size: sizeInput,
      price: orderType === "limit" ? priceInput : undefined,
      leverage,
      tp: tpInput || undefined,
      sl: slInput || undefined,
    });

    if (result.success) {
      setSizeInput("");
      setPriceInput("");
      setTpInput("");
      setSlInput("");
    }
  };

  // ─── Rendering helpers ───────────────────────────────────────────────────
  const pnlColor = (v: number) =>
    v >= 0 ? "text-[#20e6a3]" : "text-[#ff4a6b]";

  if (!ready) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-500 text-xs">
        <Loader2 size={16} className="animate-spin mr-2" /> Loading...
      </div>
    );
  }

  // ── Not authenticated: show connect prompt ───────────────────────────────
  if (!authenticated) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-4 space-y-3 bg-[#0e1114]">
        <Wallet size={28} className="text-[#20e6a3]" />
        <p className="text-white font-bold text-sm text-center">Connect to Trade</p>
        <p className="text-neutral-400 text-xs text-center">
          Sign in to get a non-custodial wallet & start trading perps on Hyperliquid.
        </p>
        <button
          onClick={login}
          className="w-full py-2.5 bg-[#20e6a3] text-black font-black text-xs uppercase tracking-wider rounded"
        >
          Connect / Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0e1114] overflow-y-auto select-none text-xs">
      {/* ── Wallet badge ── */}
      <div className="px-3 pt-2.5 pb-1 border-b border-[#171c22]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#20e6a3] animate-pulse" />
            <span className="text-[#20e6a3] font-mono text-[10px]">
              {embeddedWallet
                ? `${embeddedWallet.address.slice(0, 6)}…${embeddedWallet.address.slice(-4)}`
                : "Wallet ready"}
            </span>
          </div>
          <span className="text-neutral-500 text-[10px]">
            {loadingAccount ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              `$${parseFloat(account?.accountValue ?? "0").toFixed(2)} equity`
            )}
          </span>
        </div>
        {/* Balance bar */}
        <div className="mt-1.5 flex justify-between text-[10px] text-neutral-500">
          <span>Available</span>
          <span className="text-neutral-300 font-mono">
            ${availableBalance.toFixed(2)} USDC
          </span>
        </div>
      </div>

      <div className="px-3 py-2 space-y-2.5">
        {/* ── Margin mode / leverage ── */}
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => setMarginMode("cross")}
            className={`py-1 rounded text-[10px] font-bold border ${
              marginMode === "cross"
                ? "border-[#20e6a3] text-[#20e6a3] bg-[#20e6a3]/5"
                : "border-[#171c22] text-neutral-500 bg-[#171c22]"
            }`}
          >
            Cross
          </button>
          <button
            onClick={() => setMarginMode("isolated")}
            className={`py-1 rounded text-[10px] font-bold border ${
              marginMode === "isolated"
                ? "border-[#20e6a3] text-[#20e6a3] bg-[#20e6a3]/5"
                : "border-[#171c22] text-neutral-500 bg-[#171c22]"
            }`}
          >
            Isolated
          </button>
          <div className="bg-[#171c22] text-[#20e6a3] font-black text-[10px] py-1 rounded text-center border border-[#262f3a]">
            {leverage}×
          </div>
        </div>

        {/* Leverage slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={1}
            max={maxLev}
            value={leverage}
            onChange={(e) => setLeverage(Number(e.target.value))}
            className="w-full h-1 accent-[#20e6a3] cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-600">
            <span>1×</span>
            <span>{Math.round(maxLev / 2)}×</span>
            <span>{maxLev}×</span>
          </div>
        </div>

        {/* ── Order type tabs ── */}
        <div className="grid grid-cols-2 border-b border-[#171c22] text-center font-bold text-[10px] pb-1">
          <span
            onClick={() => setOrderType("market")}
            className={`pb-1 cursor-pointer ${
              orderType === "market" ? "text-white border-b-2 border-white" : "text-neutral-500"
            }`}
          >
            Market
          </span>
          <span
            onClick={() => setOrderType("limit")}
            className={`pb-1 cursor-pointer ${
              orderType === "limit" ? "text-white border-b-2 border-white" : "text-neutral-500"
            }`}
          >
            Limit
          </span>
        </div>

        {/* ── Buy / Sell toggle ── */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/40 border border-[#171c22] rounded">
          <button
            onClick={() => setSide("buy")}
            className={`py-1.5 rounded text-[11px] font-black uppercase ${
              side === "buy" ? "bg-[#20e6a3] text-black" : "text-neutral-400"
            }`}
          >
            Buy / Long
          </button>
          <button
            onClick={() => setSide("sell")}
            className={`py-1.5 rounded text-[11px] font-black uppercase ${
              side === "sell" ? "bg-[#ff4a6b] text-white" : "text-neutral-400"
            }`}
          >
            Sell / Short
          </button>
        </div>

        {/* ── Price input (limit only) ── */}
        {orderType === "limit" && (
          <div className="space-y-0.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">Price</span>
            <div className="relative">
              <input
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={markPrice.toFixed(1)}
                className="w-full bg-black border border-[#171c22] rounded p-1.5 text-right text-white font-bold text-xs focus:outline-none focus:border-[#20e6a3] pr-12"
              />
              <span className="absolute right-2 top-1.5 text-neutral-400 font-mono text-[10px]">
                USDC
              </span>
            </div>
          </div>
        )}

        {/* ── Size input ── */}
        <div className="space-y-0.5">
          <span className="text-[10px] text-neutral-500 font-bold uppercase">Size</span>
          <div className="relative">
            <input
              type="number"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              placeholder="0.000"
              className="w-full bg-black border border-[#171c22] rounded p-1.5 text-right text-white font-bold text-xs focus:outline-none focus:border-[#20e6a3] pr-12"
            />
            <span className="absolute right-2 top-1.5 text-neutral-400 font-mono text-[10px]">
              {coin}
            </span>
          </div>
          {/* Quick-size buttons */}
          <div className="grid grid-cols-4 gap-1 pt-0.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => {
                  const maxSize = (availableBalance * leverage) / (markPrice || 1);
                  setSizeInput(((maxSize * pct) / 100).toFixed(4));
                }}
                className="bg-[#171c22] text-neutral-400 py-0.5 rounded text-[9px] hover:text-white hover:bg-[#1e262f]"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        {/* ── TP / SL toggle ── */}
        <button
          onClick={() => setShowTpSl((v) => !v)}
          className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1"
        >
          <span className="text-[#20e6a3]">{showTpSl ? "−" : "+"}</span>
          Take Profit / Stop Loss
        </button>

        {showTpSl && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#20e6a3] font-bold uppercase">TP</span>
              <input
                type="number"
                value={tpInput}
                onChange={(e) => setTpInput(e.target.value)}
                placeholder="Price"
                className="w-full bg-black border border-[#20e6a3]/30 rounded p-1.5 text-right text-white font-bold text-xs focus:outline-none focus:border-[#20e6a3]"
              />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-[#ff4a6b] font-bold uppercase">SL</span>
              <input
                type="number"
                value={slInput}
                onChange={(e) => setSlInput(e.target.value)}
                placeholder="Price"
                className="w-full bg-black border border-[#ff4a6b]/30 rounded p-1.5 text-right text-white font-bold text-xs focus:outline-none focus:border-[#ff4a6b]"
              />
            </div>
          </div>
        )}

        {/* ── Order summary ── */}
        <div className="border-t border-[#171c22] pt-2 space-y-0.5 text-[10px] text-neutral-500 font-medium">
          <div className="flex justify-between">
            <span>Notional</span>
            <span className="text-neutral-300 font-mono">
              ${notional > 0 ? notional.toFixed(2) : "—"} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span>Est. Margin</span>
            <span className="text-neutral-300 font-mono">
              ${margin > 0 ? margin.toFixed(2) : "—"} USDC
            </span>
          </div>
          <div className="flex justify-between">
            <span>Liq. Price (est.)</span>
            <span className="text-[#ff4a6b] font-mono">
              {sizeNum > 0 && markPrice > 0
                ? (side === "buy"
                    ? markPrice * (1 - 1 / leverage)
                    : markPrice * (1 + 1 / leverage)
                  ).toFixed(1)
                : "—"}
            </span>
          </div>
        </div>

        {/* ── Submit button ── */}
        <button
          onClick={handleSubmit}
          disabled={isPlacing || !sizeInput || sizeNum <= 0}
          className={`w-full py-2.5 rounded text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 ${
            isPlacing || !sizeInput || sizeNum <= 0
              ? "opacity-40 cursor-not-allowed bg-neutral-700 text-neutral-400"
              : side === "buy"
              ? "bg-[#20e6a3] text-black hover:bg-[#1bd89a]"
              : "bg-[#ff4a6b] text-white hover:bg-[#f03a5e]"
          }`}
        >
          {isPlacing && <Loader2 size={12} className="animate-spin" />}
          {isPlacing
            ? "Placing…"
            : `${side === "buy" ? "Long" : "Short"} ${coin} ${leverage}×`}
        </button>

        {/* ── Order result feedback ── */}
        {lastResult && (
          <div
            className={`rounded p-2 text-[10px] border ${
              lastResult.success
                ? "bg-[#20e6a3]/5 border-[#20e6a3]/20 text-[#20e6a3]"
                : "bg-[#ff4a6b]/5 border-[#ff4a6b]/20 text-[#ff4a6b]"
            }`}
          >
            <div className="flex items-center gap-1 font-bold">
              {lastResult.success ? (
                <>
                  <CheckCircle2 size={11} />
                  Order Filled{lastResult.orderId ? ` #${lastResult.orderId}` : ""}
                </>
              ) : (
                <>
                  <AlertTriangle size={11} />
                  Order Failed
                </>
              )}
            </div>
            {lastResult.success && lastResult.explorerUrl && (
              <a
                href={lastResult.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 mt-0.5 underline hover:opacity-80"
              >
                View on HL Explorer <ExternalLink size={9} />
              </a>
            )}
            {!lastResult.success && lastResult.error && (
              <p className="mt-0.5 text-[9px] opacity-80 break-all">
                {lastResult.error}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Open Positions ── */}
      {account && account.positions.length > 0 && (
        <div className="border-t border-[#171c22] px-3 pt-2 pb-3 mt-1">
          <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1.5">
            Open Positions ({account.positions.length})
          </p>
          <div className="space-y-1.5">
            {account.positions.map((pos) => {
              const isLong = parseFloat(pos.szi) > 0;
              const pnl = parseFloat(pos.unrealizedPnl);
              const roe = parseFloat(pos.returnOnEquity) * 100;
              return (
                <div
                  key={pos.coin}
                  className="bg-[#12161a] rounded p-2 border border-[#1c2228]"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-bold">{pos.coin}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isLong
                          ? "bg-[#20e6a3]/10 text-[#20e6a3]"
                          : "bg-[#ff4a6b]/10 text-[#ff4a6b]"
                      }`}
                    >
                      {isLong ? "LONG" : "SHORT"} {pos.leverage.value}×
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 mt-1 text-[10px]">
                    <div>
                      <span className="text-neutral-500">Size</span>
                      <span className="ml-1 text-neutral-300 font-mono">
                        {Math.abs(parseFloat(pos.szi)).toFixed(4)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Entry</span>
                      <span className="ml-1 text-neutral-300 font-mono">
                        ${parseFloat(pos.entryPx).toFixed(1)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">PnL</span>
                      <span className={`ml-1 font-mono font-bold ${pnlColor(pnl)}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500">ROE</span>
                      <span className={`ml-1 font-mono font-bold ${pnlColor(roe)}`}>
                        {roe >= 0 ? "+" : ""}
                        {roe.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {pos.liquidationPx && (
                    <div className="mt-1 text-[9px] text-[#ff4a6b]/70">
                      Liq: ${parseFloat(pos.liquidationPx).toFixed(1)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};