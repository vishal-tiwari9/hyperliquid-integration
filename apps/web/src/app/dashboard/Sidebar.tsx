"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  TrendingUp, 
  ArrowLeftRight, 
  ShieldCheck, 
  Wallet 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  // Explicit route map configuration matrix
  const navigationLinks = [
    { 
      href: "/dashboard/trade", 
      label: "High-Frequency Terminal", 
      icon: TrendingUp 
    },
    { 
      href: "/dashboard/on-off-ramp", 
      label: "Instant On/Off Ramp", 
      icon: ArrowLeftRight 
    },
  ];

  return (
    <aside className="w-64 h-full bg-[#09090b] border-r border-[#27272a] flex flex-col justify-between z-20 shrink-0">
      <div>
        {/* Branding Workspace Identifier */}
        <div className="h-16 flex items-center px-6 border-b border-[#27272a] gap-2.5">
          <div className="h-7 w-7 rounded bg-emerald-500 flex items-center justify-center font-black text-black text-xs font-mono">
            M
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white block font-mono">mochatrade</span>
            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest block -mt-0.5">L1 Core Node</span>
          </div>
        </div>

        {/* Global Financial Allocation Metric Layout */}
        <div className="p-4 mx-3 my-4 bg-[#141417] border border-[#27272a] rounded-lg">
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold tracking-wide uppercase">
            <span>Buying Power (INR)</span>
            <Wallet className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <p className="text-lg font-mono font-bold text-white mt-1.5 tracking-tight">₹4,50,230.40</p>
          <div className="mt-2 pt-2 border-t border-[#27272a]/60 flex justify-between items-center text-[10px] text-neutral-500 font-mono">
            <span>Margin Utilized</span>
            <span className="text-amber-400 font-bold">12.4%</span>
          </div>
        </div>

        {/* Dynamic Client Routing System links */}
        <nav className="px-3 space-y-1">
          {navigationLinks.map((link) => {
            const Icon = link.icon;
            // Evaluates whether link path exactly matches active Next router history
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-xs transition-all duration-150 ${
                  isActive 
                    ? "bg-[#18181b] text-white border border-[#27272a] shadow-sm shadow-black" 
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-[#141417]/50"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-neutral-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Compliance Framework Bottom Guard */}
      <div className="p-4 border-t border-[#27272a] bg-[#141417]/20">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-neutral-500 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> FIU-IND Rail Verified
          </span>
          <span className="text-emerald-400 font-bold text-[10px] uppercase">Active</span>
        </div>
      </div>
    </aside>
  );
}