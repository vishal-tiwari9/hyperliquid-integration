"use client";

import { useState } from "react";
import MarketHeader from "./components/MarketHeader";
import MarketSelector from "./components/MarketSelector";
import TradingChart from "./components/TradingChart";
import OrderBook from "./components/OrderBook";
import RecentTrades from "./components/RecentTrades";
import OrderPanel from "./components/OrderPanel";

export default function TradePage() {
  const [selectedCoin, setSelectedCoin] = useState<string>("BTC");
  const [leverage, setLeverage] = useState<number>(20);

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A] text-white overflow-hidden">
      {/* Top Header */}
      <MarketHeader 
        selectedCoin={selectedCoin} 
        onCoinChange={setSelectedCoin} 
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Market List */}
        <div className="w-72 border-r border-white/10 bg-zinc-950">
          <MarketSelector 
            selectedCoin={selectedCoin} 
            onSelect={setSelectedCoin} 
          />
        </div>

        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col">
          <TradingChart coin={selectedCoin} />
        </div>

        {/* Center - Order Book */}
        <div className="w-96 border-r border-white/10 bg-zinc-950">
          <OrderBook coin={selectedCoin} />
        </div>

        {/* Right - Order Panel */}
        <div className="w-96 bg-zinc-950 border-l border-white/10">
          <OrderPanel 
            coin={selectedCoin} 
            leverage={leverage}
            onLeverageChange={setLeverage}
          />
        </div>
      </div>

      {/* Bottom Bar - Recent Trades */}
      <div className="h-52 border-t border-white/10 bg-zinc-950">
        <RecentTrades coin={selectedCoin} />
      </div>
    </div>
  );
}