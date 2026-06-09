"use client";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { IS_TESTNET } from "@/lib/config";
import { useState } from "react";
import Link from "next/link";
import { Copy, Check, LogOut, Settings, Globe } from "lucide-react";

export function Navbar() {
  const { authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const embedded = wallets.find(w => w.walletClientType === "privy");
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!embedded?.address) return;
    navigator.clipboard.writeText(embedded.address);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <nav
      className="h-[44px] flex items-center justify-between px-4 border-b shrink-0 z-50"
      style={{ background:"var(--bg-1)", borderColor:"var(--border)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-1">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="14" fill="url(#g)" />
            <text x="14" y="19" textAnchor="middle" fill="black" fontSize="13" fontWeight="900" fontFamily="Arial">M</text>
            <defs>
              <linearGradient id="g" x1="0" y1="0" x2="28" y2="28">
                <stop offset="0%" stopColor="#0ecb81"/>
                <stop offset="100%" stopColor="#02a86e"/>
              </linearGradient>
            </defs>
          </svg>
          <span className="font-bold text-[15px] text-white tracking-tight">MochaTrade</span>
        </Link>

        <div className="flex items-center text-[13px] font-medium" style={{color:"var(--t2)"}}>
          {[
            { href:"/dashboard/trade",     label:"Trade"    },
            { href:"/dashboard/portfolio", label:"Portfolio"},
            { href:"/dashboard/bank",      label:"Earn"     },
            { href:"/dashboard/bank",      label:"Vaults"   },
          ].map(({ href, label }) => (
            <Link key={label} href={href}
              className="px-3 py-1 rounded transition-colors hover:text-white"
              style={label==="Trade"?{color:"var(--t1)"}:{}}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {IS_TESTNET && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded"
            style={{background:"rgba(255,193,7,.1)",color:"#ffc107",border:"1px solid rgba(255,193,7,.2)"}}>
            TESTNET
          </span>
        )}

        {authenticated && embedded ? (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer"
              style={{background:"var(--bg-3)",border:"1px solid var(--border2)"}}>
              <div className="w-2 h-2 rounded-full pulse" style={{background:"var(--green)"}} />
              <span className="font-mono text-[12px]" style={{color:"var(--green)"}}>
                {embedded.address.slice(0,6)}…{embedded.address.slice(-4)}
              </span>
            </div>
            <button onClick={copy} title="Copy address"
              className="p-1.5 rounded transition-colors hover:text-white"
              style={{color:"var(--t3)"}}>
              {copied
                ? <Check size={13} style={{color:"var(--green)"}} />
                : <Copy size={13} />}
            </button>
            <button onClick={logout} title="Disconnect"
              className="p-1.5 rounded transition-colors"
              style={{color:"var(--t3)"}}
              onMouseEnter={e=>(e.currentTarget.style.color="var(--red)")}
              onMouseLeave={e=>(e.currentTarget.style.color="var(--t3)")}>
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button onClick={login}
            className="px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-colors"
            style={{background:"var(--green)",color:"#0d0e0f"}}
            onMouseEnter={e=>(e.currentTarget.style.background="var(--green2)")}
            onMouseLeave={e=>(e.currentTarget.style.background="var(--green)")}>
            Connect
          </button>
        )}
        <button className="p-1.5 rounded transition-colors" style={{color:"var(--t3)"}}>
          <Globe size={15} />
        </button>
        <button className="p-1.5 rounded transition-colors" style={{color:"var(--t3)"}}>
          <Settings size={15} />
        </button>
      </div>
    </nav>
  );
}