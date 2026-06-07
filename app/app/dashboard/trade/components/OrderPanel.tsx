"use client";
import { useState } from "react";
export default function OrderPanel({ 
  coin, 
  leverage, 
  onLeverageChange 
}: { 
  coin: string; 
  leverage: number; 
  onLeverageChange: (lev: number) => void;
}) {
  const [side, setSide] = useState<"long" | "short">("long");
  const [size, setSize] = useState("0.1");

  return (
    <div className="p-5 space-y-6">
      <div className="flex gap-2">
        <button
          onClick={() => setSide("long")}
          className={`flex-1 py-3 rounded-xl font-bold ${side === "long" ? "bg-emerald-600" : "bg-zinc-800"}`}
        >
          Buy / Long
        </button>
        <button
          onClick={() => setSide("short")}
          className={`flex-1 py-3 rounded-xl font-bold ${side === "short" ? "bg-red-600" : "bg-zinc-800"}`}
        >
          Sell / Short
        </button>
      </div>

      <div>
        <label className="text-xs text-gray-400">Leverage</label>
        <input
          type="range"
          min={1}
          max={50}
          value={leverage}
          onChange={(e) => onLeverageChange(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-center font-bold text-xl">{leverage}x</div>
      </div>

      <div>
        <label className="text-xs text-gray-400">Size ({coin})</label>
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="w-full bg-zinc-900 border border-white/20 rounded-xl px-4 py-3 text-xl"
        />
      </div>

      <button className={`w-full py-4 text-xl font-bold rounded-2xl ${side === "long" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"}`}>
        {side === "long" ? "LONG" : "SHORT"} {coin}
      </button>
    </div>
  );
}