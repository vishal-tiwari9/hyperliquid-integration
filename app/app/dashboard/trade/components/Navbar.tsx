"use client";
// app/dashboard/trade/components/Navbar.tsx

import React from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Settings, Globe, LogOut, Wallet } from "lucide-react";
import { IS_TESTNET } from "@/lib/config";
import Link from "next/link";

export const Navbar: React.FC = () => {
  const { authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const embedded = wallets.find((w) => w.walletClientType === "privy");

  return (
    <nav className="w-full h-12 bg-[#0e1114] border-b border-[#171c22] px-4 flex items-center justify-between shrink-0 z-40 select-none">
      {/* Left: Logo + nav links */}
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2 cursor-pointer">
          <svg className="h-5 w-5 text-[#20e6a3]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-white font-black tracking-tight text-base">MochaTrade</span>
        </Link>

        {/* Testnet badge */}
        {IS_TESTNET && (
          <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded">
            TESTNET
          </span>
        )}

        <div className="hidden xl:flex items-center space-x-1 text-[13px] font-semibold">
          <Link
            href="/dashboard/trade"
            className="px-3 py-1.5 text-white bg-white/5 rounded cursor-pointer"
          >
            Trade
          </Link>
          <Link
            href="/dashboard/portfolio"
            className="px-3 py-1.5 text-[#8e9aa9] hover:text-white cursor-pointer transition-colors"
          >
            Portfolio
          </Link>
          <span className="px-3 py-1.5 text-[#8e9aa9] hover:text-white cursor-pointer transition-colors">
            On/Off Ramp
          </span>
        </div>
      </div>

      {/* Right: wallet + settings */}
      <div className="flex items-center space-x-3">
        {authenticated && embedded ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#171c22] border border-[#262f3a] px-2.5 py-1 rounded">
              <div className="w-1.5 h-1.5 rounded-full bg-[#20e6a3]" />
              <span className="text-[#20e6a3] font-mono text-[11px]">
                {embedded.address.slice(0, 6)}…{embedded.address.slice(-4)}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-[#556070] hover:text-[#ff4a6b] cursor-pointer transition-colors"
              title="Disconnect"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={login}
            className="flex items-center gap-1.5 bg-[#20e6a3]/10 border border-[#20e6a3]/30 text-[#20e6a3] px-2.5 py-1 rounded text-[11px] font-bold hover:bg-[#20e6a3]/20 transition-colors"
          >
            <Wallet size={12} />
            Connect
          </button>
        )}
        <Settings size={16} className="text-[#556070] hover:text-white cursor-pointer" />
        <Globe size={16} className="text-[#556070] hover:text-white cursor-pointer" />
      </div>
    </nav>
  );
};