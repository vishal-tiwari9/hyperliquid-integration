"use client";
// app/dashboard/trade/components/MarketStatsStrip.tsx

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, Wifi, WifiOff } from "lucide-react";

interface MarketStatsStripProps {
  coin: string;
  setCoin: (coin: string) => void;
  markPrice: number;
  availableMarkets: string[];
  isConnected?: boolean;
}

export const MarketStatsStrip: React.FC<MarketStatsStripProps> = ({
  coin,
  setCoin,
  markPrice,
  availableMarkets,
  isConnected = false,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (searchOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [searchOpen]);

  // Close on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as Element).closest("[data-market-dropdown]")) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [searchOpen]);

  const filtered = availableMarkets.filter((c) =>
    c.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fmtPrice = (p: number) =>
    p > 0 ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";

  return (
    <section className="w-full bg-[#0e1114] border-b border-[#171c22] px-4 py-2 flex items-center space-x-7 shrink-0 z-30 select-none">
      {/* Market selector */}
      <button
        ref={buttonRef}
        data-market-dropdown
        onClick={() => setSearchOpen((v) => !v)}
        className="flex items-center space-x-2 bg-[#171c22] hover:bg-[#202730] text-white font-bold px-3 py-1 rounded border border-[#262f3a] transition-colors"
      >
        <span className="text-sm font-black tracking-wide">{coin}-USDC</span>
        <span className="text-[10px] text-[#20e6a3] bg-[#20e6a3]/10 px-1 rounded font-mono">
          PERP
        </span>
        <ChevronDown size={14} className="text-neutral-400" />
      </button>

      {/* Portal dropdown */}
      {searchOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            data-market-dropdown
            className="absolute w-72 bg-[#0e1114] border border-[#262f3a] rounded p-2 shadow-2xl z-[9999]"
            style={{ top: dropdownPos.top, left: dropdownPos.left }}
          >
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2.5 top-2.5 text-neutral-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search markets…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black border border-[#171c22] rounded p-1.5 pl-7 text-white text-xs focus:outline-none focus:border-[#20e6a3]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-[#171c22]">
              {filtered.map((m) => (
                <div
                  key={m}
                  onClick={() => {
                    setCoin(m);
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className={`flex justify-between items-center p-2 hover:bg-[#171c22] cursor-pointer rounded ${
                    m === coin ? "bg-[#171c22]" : ""
                  }`}
                >
                  <div>
                    <span className="text-white font-bold">{m}-USDC</span>
                    <span className="ml-2 text-[10px] text-neutral-500">PERP</span>
                  </div>
                  {m === coin && (
                    <span className="text-[#20e6a3] font-mono text-[11px]">
                      ${fmtPrice(markPrice)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}

      {/* Mark price */}
      <div className="flex flex-col font-mono">
        <span className="text-[10px] text-[#566273] font-bold uppercase tracking-wider">
          Mark
        </span>
        <span className="text-white font-bold text-xs">${fmtPrice(markPrice)}</span>
      </div>

      {/* 24h change placeholder */}
      {/* <div className="hidden md:flex flex-col font-mono">
        <span className="text-[10px] text-[#566273] font-bold uppercase tracking-wider">
          24h Change
        </span>
        <span className="text-[#20e6a3] font-bold text-xs">—</span>
      </div> */}

      {/* 24h volume placeholder */}
      {/* <div className="hidden lg:flex flex-col font-mono">
        <span className="text-[10px] text-[#566273] font-bold uppercase tracking-wider">
          24h Vol
        </span>
        <span className="text-neutral-300 font-bold text-xs">—</span>
      </div> */}

      {/* Open interest placeholder */}
      {/* <div className="hidden xl:flex flex-col font-mono">
        <span className="text-[10px] text-[#566273] font-bold uppercase tracking-wider">
          OI
        </span>
        <span className="text-neutral-300 font-bold text-xs">—</span>
      </div> */}

      {/* Connection status */}
      <div className="ml-auto flex items-center gap-1.5 text-[10px]">
        {isConnected ? (
          <>
            <Wifi size={11} className="text-[#20e6a3]" />
            <span className="text-[#20e6a3]">Live</span>
          </>
        ) : (
          <>
            <WifiOff size={11} className="text-yellow-500" />
            <span className="text-yellow-500">Connecting…</span>
          </>
        )}
      </div>
    </section>
  );
};