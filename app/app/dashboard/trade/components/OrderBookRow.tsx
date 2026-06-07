"use client";

import { useHyperliquid } from "../../../../hooks/useHyperliquidChart";

export default function OrderBook({ coin }: { coin: string }) {
  const { orderbook } = useHyperliquid(coin);

  const bids = orderbook?.data?.bids || [];
  const asks = orderbook?.data?.asks || [];

  return (
    <div className="h-full flex flex-col bg-[#0A0A0A]">
      <div className="p-4 border-b border-white/10 font-semibold text-lg">Order Book</div>

      <div className="flex-1 overflow-auto text-sm font-mono">
        {/* Asks (Sell) - Red on top */}
        <div className="bg-red-500/10 py-1 px-4 text-red-400 text-xs font-medium">SELL</div>
        {asks.slice(0, 12).map(([price, size]: [string, string], i) => (
          <div key={i} className="flex justify-between px-4 py-1 hover:bg-white/5">
            <span className="text-red-400">{Number(price).toFixed(2)}</span>
            <span>{Number(size).toFixed(4)}</span>
          </div>
        ))}

        {/* Mid Price */}
        <div className="bg-white/10 py-3 text-center text-xl font-bold border-y border-white/20">
          {orderbook?.data?.mid || bids[0]?.[0] || "—"}
        </div>

        {/* Bids (Buy) - Green */}
        <div className="bg-emerald-500/10 py-1 px-4 text-emerald-400 text-xs font-medium">BUY</div>
        {bids.slice(0, 12).map(([price, size]: [string, string], i) => (
          <div key={i} className="flex justify-between px-4 py-1 hover:bg-white/5">
            <span className="text-emerald-400">{Number(price).toFixed(2)}</span>
            <span>{Number(size).toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}