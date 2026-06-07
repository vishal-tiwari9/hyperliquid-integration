"use client";

import React, { useState } from "react";
import { useHyperliquidStream } from "@/hooks/useHyperliquidStream";
import { Navbar } from "./components/Navbar";
import { MarketStatsStrip } from "./components/MarketStatsStrip";
import { TradingChart } from "./components/TradingChart";
import { MarketDepthPanel } from "./components/MarketDepthPanel";
import { ExecutionTerminal } from "./components/ExecutionTerminal";

export default function TerminalWorkspacePage() {
  const [coin, setCoin] = useState<string>("BTC");
  const availableMarkets = ["BTC", "ETH", "SOL", "HYPE", "ARB"];

  // Central Streaming Hook wired directly into your Rust Proxy Framework Layer
  const { 
    bids, 
    asks, 
    maxBookTotal, 
    recentTrades, 
    markPrice, 
    spread, 
    candleHistoryRef, 
    currentPriceRef 
  } = useHyperliquidStream({
    coin,
    proxyRestUrl: "https://api.hyperliquid.xyz", // Replace with local network url if proxy overrides info route
    proxyWsUrl: "ws://localhost:3001/ws"        // Target point routing inside your Rust architecture loop
  });


  

  return (
    <div className="h-screen w-screen bg-[#07090b] text-[#8e9aa9] text-xs flex flex-col overflow-hidden">
      <Navbar />
      
      <MarketStatsStrip 
        coin={coin} 
        setCoin={setCoin} 
        markPrice={markPrice} 
        availableMarkets={availableMarkets} 
      />

      <div className="w-full flex-grow flex flex-row min-h-0 overflow-hidden">
        
        {/* Left Container Panel Matrix: Interactive Graphics Canvas Context */}
        <div className="flex-[14_14_0%] flex flex-col border-r border-[#171c22] min-w-0 h-full">
          <div className="h-8 bg-[#0e1114] border-b border-[#171c22] px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3 font-mono text-[11px] text-neutral-400">
              <span className="px-1.5 py-0.5 bg-[#171c22] text-[#20e6a3] font-bold rounded">1h</span>
              <span className="hover:text-white cursor-pointer px-1">Indicators</span>
            </div>
          </div>
          
          <TradingChart 
            coin={coin} 
            currentPriceRef={currentPriceRef} 
            candleHistoryRef={candleHistoryRef} 
          />

          <div className="h-40 bg-[#0e1114] border-t border-[#171c22] flex flex-col shrink-0">
            <div className="h-8 border-b border-[#171c22] px-4 flex items-center space-x-5 text-[11px] font-bold text-neutral-400 shrink-0">
              <span className="text-white border-b-2 border-white h-8 flex items-center">Positions (0)</span>
              <span className="hover:text-white cursor-pointer h-8 flex items-center">Balances</span>
            </div>
            <div className="flex-grow flex items-center justify-center text-neutral-600 font-bold italic">
              No open liability configurations mapped to current node instance.
            </div>
          </div>
        </div>

        {/* Middle Container Panel Matrix: Live Depth and Tape Matrices */}
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

        {/* Right Container Panel Matrix: Transaction Entry Desk Desk Layout */}
        <div className="flex-[4_4_0%] flex flex-col min-w-[220px] h-full">
          <ExecutionTerminal coin={coin} markPrice={markPrice} />
        </div>

      </div>
    </div>
  );
}