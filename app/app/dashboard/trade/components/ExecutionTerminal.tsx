"use client";

import React, { useState } from "react";

interface ExecutionTerminalProps {
  coin: string;
  markPrice: number;
}

export const ExecutionTerminal: React.FC<ExecutionTerminalProps> = ({ coin, markPrice }) => {
  const [orderSide, setOrderSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [sizeInput, setSizeInput] = useState("");
  const [priceInput, setPriceInput] = useState("");

  return (
    <div className="w-full h-full p-3 bg-[#0e1114] flex flex-col space-y-3 justify-start overflow-y-auto select-none">
      <div className="grid grid-cols-3 gap-1 shrink-0">
        <button className="bg-[#171c22] text-white py-1 rounded font-bold border border-[#262f3a] text-[11px]">Cross</button>
        <button className="bg-[#171c22] text-zinc-400 py-1 rounded border border-[#171c22] text-[11px] font-medium">40x</button>
        <button className="bg-[#171c22] text-zinc-400 py-1 rounded border border-[#171c22] text-[11px] font-medium">Unified</button>
      </div>

      <div className="grid grid-cols-2 border-b border-[#171c22] text-center font-bold text-[11px] pb-1 shrink-0">
        <span onClick={() => setOrderType("market")} className={`pb-1 cursor-pointer ${orderType === "market" ? "text-white border-b-2 border-white font-black" : "text-neutral-500"}`}>Market</span>
        <span onClick={() => setOrderType("limit")} className={`pb-1 cursor-pointer ${orderType === "limit" ? "text-white border-b-2 border-white font-black" : "text-neutral-500"}`}>Limit</span>
      </div>

      <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/40 border border-[#171c22] rounded shrink-0">
        <button onClick={() => setOrderSide("buy")} className={`py-1 rounded text-[11px] font-bold uppercase ${orderSide === "buy" ? "bg-[#20e6a3] text-black font-black" : "text-neutral-400"}`}>Buy / Long</button>
        <button onClick={() => setOrderSide("sell")} className={`py-1 rounded text-[11px] font-bold uppercase ${orderSide === "sell" ? "bg-[#ff4a6b] text-white font-black" : "text-neutral-400"}`}>Sell / Short</button>
      </div>

      <div className="space-y-2 shrink-0">
        {orderType === "limit" && (
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] text-neutral-500 font-bold uppercase">Price Threshold</span>
            <div className="relative">
              <input type="number" value={priceInput} onChange={(e) => setPriceInput(e.target.value)} className="w-full bg-black border border-[#171c22] rounded p-1.5 text-right text-white font-bold text-xs focus:outline-none" placeholder={markPrice.toFixed(1)} />
              <span className="absolute left-2.5 top-2 text-neutral-500 font-bold text-[10px]">Price</span>
              <span className="absolute right-2.5 top-2 text-neutral-400 font-mono text-[10px]">USDC</span>
            </div>
          </div>
        )}
        <div className="flex flex-col space-y-0.5">
          <span className="text-[10px] text-neutral-500 font-bold uppercase">Size Matrix</span>
          <div className="relative">
            <input type="number" value={sizeInput} onChange={(e) => setSizeInput(e.target.value)} className="w-full bg-black border border-[#171c22] rounded p-1.5 text-right text-white font-bold text-xs focus:outline-none" placeholder="0.0" />
            <span className="absolute left-2.5 top-2 text-neutral-500 font-bold text-[10px]">Size</span>
            <span className="absolute right-2.5 top-2 text-neutral-400 font-mono text-[10px]">{coin}</span>
          </div>
        </div>
      </div>

      <button type="button" className="w-full bg-[#20e6a3] text-black font-black text-center py-2.5 rounded text-[11px] uppercase tracking-wider shrink-0">
        Connect Wallet
      </button>

      <div className="pt-2 border-t border-[#171c22] space-y-1 text-[10px] text-neutral-500 font-medium shrink-0">
        <div className="flex justify-between"><span>Order Valuation</span><span className="text-neutral-300 font-mono">{(parseFloat(sizeInput || "0") * markPrice).toFixed(2)} USDC</span></div>
      </div>
    </div>
  );
};