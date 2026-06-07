"use client";

import { useEffect, useState } from "react";

export default function OrderBook({ coin }: { coin: string }) {
  const [orderbook, setOrderbook] = useState<any>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001/ws");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.subscription?.coin === coin) {
        setOrderbook(data);
      }
    };

    return () => ws.close();
  }, [coin]);

  const bids = orderbook?.data?.bids || [];
  const asks = orderbook?.data?.asks || [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10 font-semibold">Order Book</div>
      
      <div className="flex-1 overflow-auto text-sm font-mono">
        {/* Asks (Sell) - Red */}
        {asks.slice(0, 15).map(([price, size]: [string, string], i: number) => (
          <div key={i} className="flex justify-between px-4 py-1 text-red-400 hover:bg-white/5">
            <span>{price}</span>
            <span>{size}</span>
          </div>
        ))}

        <div className="bg-white/5 py-2 text-center text-lg font-bold border-y border-white/10">
          {orderbook?.data?.mid || "62,234"}
        </div>

        {/* Bids (Buy) - Green */}
        {bids.slice(0, 15).map(([price, size]: [string, string], i: number) => (
          <div key={i} className="flex justify-between px-4 py-1 text-emerald-400 hover:bg-white/5">
            <span>{price}</span>
            <span>{size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}