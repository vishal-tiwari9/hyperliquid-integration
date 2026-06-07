"use client";

import { useEffect, useState } from "react";

export default function MarketSelector({ selectedCoin, onSelect }: { 
  selectedCoin: string; 
  onSelect: (coin: string) => void;
}) {
  const [markets, setMarkets] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/markets")
      .then(r => r.json())
      .then(data => setMarkets(data.markets || []));
  }, []);

  const filtered = markets.filter(m => 
    m.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <input
          type="text"
          placeholder="Search markets..."
          className="w-full bg-zinc-900 border border-white/20 rounded-xl px-4 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.map((coin) => (
          <div
            key={coin}
            onClick={() => onSelect(coin)}
            className={`px-4 py-3 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 ${
              selectedCoin === coin ? "bg-blue-600/20" : ""
            }`}
          >
            <span className="font-medium">{coin}-USDC</span>
            <span className="text-xs text-emerald-400">40x</span>
          </div>
        ))}
      </div>
    </div>
  );
}