import React, { useState } from "react";
import { ChevronDown, Search } from "lucide-react";

interface MarketStatsStripProps {
  coin: string;
  setCoin: (coin: string) => void;
  markPrice: number;
  availableMarkets: string[];
}

export const MarketStatsStrip: React.FC<MarketStatsStripProps> = ({ coin, setCoin, markPrice, availableMarkets }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = availableMarkets.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <section className="w-full bg-[#0e1114] border-b border-[#171c22] px-4 py-2 flex items-center space-x-7 shrink-0 overflow-x-auto scrollbar-none z-30 select-none">
      <div className="relative">
        <button 
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex items-center space-x-2 bg-[#171c22] hover:bg-[#202730] text-white font-bold px-3 py-1 rounded border border-[#262f3a] transition-colors"
        >
          <span className="text-sm font-black tracking-wide">{coin}-USDC</span>
          <span className="text-[10px] text-[#20e6a3] bg-[#20e6a3]/10 px-1 rounded font-mono">40x</span>
          <ChevronDown size={14} className="text-neutral-400" />
        </button>

        {searchOpen && (
          <div className="absolute top-9 left-0 w-72 bg-[#0e1114] border border-[#262f3a] rounded p-2 shadow-2xl z-50">
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search dynamic tickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-[#171c22] rounded p-1.5 pl-7 text-white text-xs focus:outline-none focus:border-[#20e6a3]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-[#171c22]">
              {filtered.map((m) => (
                <div
                  key={m}
                  onClick={() => { setCoin(m); setSearchOpen(false); }}
                  className="flex justify-between items-center p-2 hover:bg-[#171c22] cursor-pointer rounded text-white"
                >
                  <span className="font-bold">{m}-USDC</span>
                  <span className="text-[#20e6a3] font-mono">${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col font-mono">
        <span className="text-[10px] text-[#566273] font-bold uppercase tracking-wider">Mark Price</span>
        <span className="text-white font-bold text-xs">{markPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div className="flex flex-col font-mono">
        <span className="text-[10px] text-[#566273] font-bold uppercase tracking-wider">24h Change</span>
        <span className="text-[#20e6a3] font-bold">+1,222.00 / +2.01%</span>
      </div>
      <div className="flex flex-col font-mono">
        <span className="text-[10px] text-[#566273] font-bold uppercase tracking-wider">Funding Rate</span>
        <span className="text-[#20e6a3] font-bold">0.0013% <span className="text-neutral-400 font-normal ml-1">00:04:07</span></span>
      </div>
    </section>
  );
};