"use client";
// app/dashboard/trade/page.tsx

import React, { useState } from "react";
import { useHyperliquidStream } from "@/hooks/useHyperliquidStream";
import { AVAILABLE_MARKETS } from "@/lib/config";
import { Navbar } from "./components/Navbar";
import { MarketStatsStrip } from "./components/MarketStatsStrip";
import { TradingChart } from "./components/TradingChart";
import { MarketDepthPanel } from "./components/MarketDepthPanel";
import { ExecutionTerminal } from "./components/ExecutionTerminal";

export default function TerminalWorkspacePage() {
  const [coin, setCoin] = useState<string>("BTC");

  const {
    bids,
    asks,
    maxBookTotal,
    recentTrades,
    markPrice,
    spread,
    isConnected,
    candleHistoryRef,
    currentPriceRef,
  } = useHyperliquidStream(coin);

  return (
    <div className="h-screen w-screen bg-[#07090b] text-[#8e9aa9] text-xs flex flex-col">

      {/* Header */}
      <div className="relative z-50 flex-shrink-0">
        <Navbar />
        <MarketStatsStrip
          coin={coin}
          setCoin={setCoin}
          markPrice={markPrice}
          availableMarkets={AVAILABLE_MARKETS}
          isConnected={isConnected}
        />
      </div>

      {/* Main layout */}
      <div className="flex-grow flex flex-row min-h-0 w-full overflow-hidden">

        {/* Chart column */}
        <div className="flex-[14_14_0%] flex flex-col border-r border-[#171c22] min-w-0 h-full">
          {/* Chart toolbar */}
          <div className="h-8 bg-[#0e1114] border-b border-[#171c22] px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 font-mono text-[11px] text-neutral-400">
              {["5m", "15m", "1h", "4h", "1d"].map((tf) => (
                <span
                  key={tf}
                  className={`px-1.5 py-0.5 rounded cursor-pointer ${
                    tf === "1h"
                      ? "bg-[#171c22] text-[#20e6a3] font-bold"
                      : "hover:text-white"
                  }`}
                >
                  {tf}
                </span>
              ))}
            </div>
            {/* WS connection indicator */}
            <div className="flex items-center gap-1.5 text-[10px]">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-[#20e6a3] animate-pulse" : "bg-yellow-500"
                }`}
              />
              <span className={isConnected ? "text-[#20e6a3]" : "text-yellow-500"}>
                {isConnected ? "Live" : "Connecting…"}
              </span>
            </div>
          </div>

          <div className="flex-grow min-h-0">
            <TradingChart
              coin={coin}
              currentPriceRef={currentPriceRef}
              candleHistoryRef={candleHistoryRef}
            />
          </div>

          {/* Positions panel */}
          <div className="h-40 bg-[#0e1114] border-t border-[#171c22] flex flex-col shrink-0">
            <div className="h-8 border-b border-[#171c22] px-4 flex items-center space-x-5 text-[11px] font-bold text-neutral-400 shrink-0">
              {["Positions", "Open Orders", "Trade History", "Balances"].map((tab, i) => (
                <span
                  key={tab}
                  className={`h-8 flex items-center cursor-pointer ${
                    i === 0
                      ? "text-white border-b-2 border-white"
                      : "hover:text-white"
                  }`}
                >
                  {tab}
                </span>
              ))}
            </div>
            <div className="flex-grow flex items-center justify-center text-neutral-600 font-bold italic text-[11px]">
              No open positions — place your first trade →
            </div>
          </div>
        </div>

        {/* Order book column */}
        <div className="flex-[4_4_0%] border-r border-[#171c22] flex flex-col min-w-0 h-full">
          <MarketDepthPanel
            bids={bids}
            asks={asks}
            maxTotal={maxBookTotal}
            midPrice={markPrice}
            spread={spread}
            trades={recentTrades}
          />
        </div>

        {/* Execution panel */}
        <div className="flex-[4_4_0%] flex flex-col min-w-[220px] h-full overflow-hidden">
          <ExecutionTerminal coin={coin} markPrice={markPrice} />
        </div>

      </div>
    </div>
  );
}