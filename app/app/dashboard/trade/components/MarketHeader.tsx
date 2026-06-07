"use client";

import { useEffect, useState } from "react";

interface MarketHeaderProps {
  selectedCoin: string;
  onCoinChange: (coin: string) => void;
}

export default function MarketHeader({ selectedCoin, onCoinChange }: MarketHeaderProps) {
  const [marketData, setMarketData] = useState<any>(null);

  useEffect(() => {
    // Fetch live data from your proxy or HL
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:3001/orderbook/${selectedCoin}`);
        const data = await res.json();
        setMarketData(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [selectedCoin]);

  return (
    <div className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-zinc-900">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">₿</div>
          <div>
            <div className="text-2xl font-bold">{selectedCoin}-USDC</div>
            <div className="text-emerald-400 text-sm">40x Max</div>
          </div>
        </div>

        <div className="flex gap-8 text-sm">
          <div>Mark: <span className="font-mono text-white">{marketData?.markPrice || "62,234"}</span></div>
          <div>24h Change: <span className="text-emerald-500">+1.99%</span></div>
          <div>OI: <span className="font-mono">$2.08B</span></div>
          <div>Funding: <span className="text-emerald-500">0.0013%</span></div>
        </div>
      </div>
    </div>
  );
}