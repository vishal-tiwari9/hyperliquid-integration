"use client";

import React, { useState } from "react";
import { OrderbookLevel, PublicTrade } from "@/hooks/useHyperliquidStream";

interface MarketDepthPanelProps {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  maxTotal: number;
  midPrice: number;
  spread: { absolute: number; percent: number };
  trades: PublicTrade[];
}

export const MarketDepthPanel: React.FC<MarketDepthPanelProps> = ({ bids, asks, maxTotal, midPrice, spread, trades }) => {
  const [activeTab, setActiveTab] = useState<"book" | "trades">("book");

  return (
    <div className="w-full h-full flex flex-col bg-[#0e1114]">
      <div className="h-8 border-b border-[#171c22] grid grid-cols-2 text-center font-bold text-neutral-400 shrink-0">
        <button 
          onClick={() => setActiveTab("book")}
          className={`h-8 flex items-center justify-center text-[11px] ${activeTab === "book" ? "text-white border-b border-white bg-black/10" : "hover:text-white"}`}
        >
          Order Book
        </button>
        <button 
          onClick={() => setActiveTab("trades")}
          className={`h-8 flex items-center justify-center text-[11px] ${activeTab === "trades" ? "text-white border-b border-white bg-black/10" : "hover:text-white"}`}
        >
          Recent Trades
        </button>
      </div>

      <div className="flex-grow p-1 overflow-hidden flex flex-col min-h-0 font-mono text-[11px]">
        {activeTab === "book" ? (
          <div className="flex flex-col justify-between h-full">
            <div className="grid grid-cols-3 text-[#566273] font-bold pb-1 text-[10px] uppercase border-b border-[#171c22]">
              <span>Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Total</span>
            </div>
            
            <div className="flex-1 flex flex-col justify-end overflow-hidden pt-1">
              {[...asks].slice(0, 11).reverse().map((ask, i) => (
                <div key={`ask-${i}`} className="grid grid-cols-3 py-[1px] relative hover:bg-white/5">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#ff4a6b]/5 pointer-events-none" style={{ width: `${(ask.total / maxTotal) * 100}%` }} />
                  <span className="text-[#ff4a6b] z-10">{ask.price.toFixed(1)}</span>
                  <span className="text-right text-zinc-300 z-10">{ask.size.toFixed(5)}</span>
                  <span className="text-right text-neutral-500 z-10">{ask.total.toFixed(5)}</span>
                </div>
              ))}
            </div>

            <div className="bg-[#12161a] my-1 py-1 px-2 border-y border-[#171c22] flex justify-between items-center text-[10px] shrink-0">
              <span className="text-white font-black text-xs">{midPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}</span>
              <div className="space-x-2 text-neutral-400">
                <span>Spread</span>
                <span className="text-neutral-200 font-bold">{spread.absolute.toFixed(0)}</span>
                <span>{spread.percent.toFixed(3)}%</span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {bids.slice(0, 11).map((bid, i) => (
                <div key={`bid-${i}`} className="grid grid-cols-3 py-[1px] relative hover:bg-white/5">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#1acc9b]/5 pointer-events-none" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
                  <span className="text-[#1acc9b] z-10">{bid.price.toFixed(1)}</span>
                  <span className="text-right text-zinc-300 z-10">{bid.size.toFixed(5)}</span>
                  <span className="text-right text-neutral-500 z-10">{bid.total.toFixed(5)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="grid grid-cols-3 text-[#566273] font-bold pb-1 text-[10px] uppercase border-b border-[#171c22] shrink-0">
              <span>Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Time</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-[1px] pt-1 scrollbar-none">
              {trades.map((t) => (
                <div key={t.id} className="grid grid-cols-3 py-0.5 hover:bg-white/5">
                  <span className={t.side === "buy" ? "text-[#1acc9b]" : "text-[#ff4a6b]"}>{t.price.toFixed(1)}</span>
                  <span className="text-right text-zinc-300">{t.size.toFixed(4)}</span>
                  <span className="text-right text-neutral-500">{t.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};