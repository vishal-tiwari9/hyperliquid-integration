"use client";
// app/dashboard/portfolio/page.tsx
// Real-time portfolio: account equity, open positions with P&L, order history.

import React, { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useHyperliquidOrder, type Position } from "@/hooks/useHyperliquidOrder";
import { IS_TESTNET, HL_CONFIG } from "@/lib/config";
import { RefreshCw, ExternalLink, TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import { Navbar } from "../trade/components/Navbar";

export default function PortfolioPage() {
  const { authenticated, login } = usePrivy();
  const { account, loadingAccount, refreshAccount } = useHyperliquidOrder();

  const equity = parseFloat(account?.accountValue ?? "0");
  const marginUsed = parseFloat(account?.totalMarginUsed ?? "0");
  const available = parseFloat(account?.withdrawable ?? "0");
  const totalPnl = account?.positions.reduce(
    (sum, p) => sum + parseFloat(p.unrealizedPnl),
    0
  ) ?? 0;

  const pnlColor = (v: number) => (v >= 0 ? "text-[#20e6a3]" : "text-[#ff4a6b]");

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#07090b] flex flex-col">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center gap-4 text-neutral-400">
          <Activity size={40} className="text-[#20e6a3]" />
          <p className="text-white font-bold text-lg">Connect to see your portfolio</p>
          <button
            onClick={login}
            className="px-8 py-3 bg-[#20e6a3] text-black font-black rounded-xl"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090b] text-[#8e9aa9] flex flex-col">
      <Navbar />

      <div className="max-w-6xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-black text-2xl">Portfolio</h1>
            {IS_TESTNET && (
              <span className="text-yellow-400 text-xs font-bold">⚠ TESTNET</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {account?.address && (
              <a
                href={`${HL_CONFIG.explorerUrl}/trade/${account.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#20e6a3] text-xs flex items-center gap-1 hover:underline"
              >
                View on HL <ExternalLink size={11} />
              </a>
            )}
            <button
              onClick={refreshAccount}
              disabled={loadingAccount}
              className="flex items-center gap-1.5 bg-[#171c22] border border-[#262f3a] text-neutral-300 px-3 py-1.5 rounded text-xs hover:text-white"
            >
              <RefreshCw size={12} className={loadingAccount ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<DollarSign size={18} className="text-[#20e6a3]" />}
            label="Account Equity"
            value={`$${equity.toFixed(2)}`}
            sub="USDC"
            highlight
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-blue-400" />}
            label="Unrealized P&L"
            value={`${totalPnl >= 0 ? "+" : ""}$${totalPnl.toFixed(2)}`}
            sub="USDC"
            valueClass={pnlColor(totalPnl)}
          />
          <StatCard
            icon={<Activity size={18} className="text-orange-400" />}
            label="Margin Used"
            value={`$${marginUsed.toFixed(2)}`}
            sub={equity > 0 ? `${((marginUsed / equity) * 100).toFixed(1)}% of equity` : "USDC"}
          />
          <StatCard
            icon={<DollarSign size={18} className="text-neutral-400" />}
            label="Available"
            value={`$${available.toFixed(2)}`}
            sub="Withdrawable"
          />
        </div>

        {/* Open Positions */}
        <div>
          <h2 className="text-white font-bold text-sm mb-3">
            Open Positions ({account?.positions.length ?? 0})
          </h2>
          {!account || account.positions.length === 0 ? (
            <EmptyState
              text="No open positions"
              cta="Start Trading"
              href="/dashboard/trade"
            />
          ) : (
            <div className="bg-[#0e1114] rounded-xl border border-[#171c22] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#566273] text-[10px] uppercase border-b border-[#171c22]">
                    <th className="text-left px-4 py-2.5">Market</th>
                    <th className="text-right px-4 py-2.5">Side</th>
                    <th className="text-right px-4 py-2.5">Size</th>
                    <th className="text-right px-4 py-2.5">Entry</th>
                    <th className="text-right px-4 py-2.5">Liq. Price</th>
                    <th className="text-right px-4 py-2.5">Value</th>
                    <th className="text-right px-4 py-2.5">Unreal. PnL</th>
                    <th className="text-right px-4 py-2.5">ROE %</th>
                  </tr>
                </thead>
                <tbody>
                  {account.positions.map((pos) => (
                    <PositionRow key={pos.coin} pos={pos} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Open Orders */}
        <div>
          <h2 className="text-white font-bold text-sm mb-3">
            Open Orders ({account?.openOrders.length ?? 0})
          </h2>
          {!account || account.openOrders.length === 0 ? (
            <EmptyState text="No open orders" cta="Place an Order" href="/dashboard/trade" />
          ) : (
            <div className="bg-[#0e1114] rounded-xl border border-[#171c22] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#566273] text-[10px] uppercase border-b border-[#171c22]">
                    <th className="text-left px-4 py-2.5">Market</th>
                    <th className="text-right px-4 py-2.5">Side</th>
                    <th className="text-right px-4 py-2.5">Type</th>
                    <th className="text-right px-4 py-2.5">Size</th>
                    <th className="text-right px-4 py-2.5">Price</th>
                    <th className="text-right px-4 py-2.5">Order ID</th>
                  </tr>
                </thead>
                <tbody>
                  {account.openOrders.map((o: any, i: number) => (
                    <tr key={i} className="border-t border-[#171c22] hover:bg-white/5">
                      <td className="px-4 py-2.5 text-white font-bold">{o.coin}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${
                        o.side === "B" ? "text-[#20e6a3]" : "text-[#ff4a6b]"
                      }`}>
                        {o.side === "B" ? "BUY" : "SELL"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-neutral-400">{o.orderType}</td>
                      <td className="px-4 py-2.5 text-right font-mono">{o.sz}</td>
                      <td className="px-4 py-2.5 text-right font-mono">${parseFloat(o.limitPx ?? "0").toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right text-neutral-500 font-mono text-[10px]">{o.oid}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  valueClass?: string;
}) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight
          ? "bg-[#0e1114] border-[#20e6a3]/20"
          : "bg-[#0e1114] border-[#171c22]"
      }`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-[10px] text-neutral-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-black mt-0.5 ${valueClass ?? "text-white"}`}>
        {value}
      </div>
      {sub && <div className="text-[10px] text-neutral-600 mt-0.5">{sub}</div>}
    </div>
  );
}

function PositionRow({ pos }: { pos: Position }) {
  const isLong = parseFloat(pos.szi) > 0;
  const pnl = parseFloat(pos.unrealizedPnl);
  const roe = parseFloat(pos.returnOnEquity) * 100;

  return (
    <tr className="border-t border-[#171c22] hover:bg-white/5">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{pos.coin}-USDC</span>
          <span className="text-[10px] text-neutral-500">{pos.leverage.value}×</span>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            isLong
              ? "bg-[#20e6a3]/10 text-[#20e6a3]"
              : "bg-[#ff4a6b]/10 text-[#ff4a6b]"
          }`}
        >
          {isLong ? "LONG" : "SHORT"}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono text-neutral-300">
        {Math.abs(parseFloat(pos.szi)).toFixed(4)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-neutral-300">
        ${parseFloat(pos.entryPx).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right font-mono text-[#ff4a6b]">
        {pos.liquidationPx ? `$${parseFloat(pos.liquidationPx).toFixed(2)}` : "—"}
      </td>
      <td className="px-4 py-3 text-right font-mono text-neutral-300">
        ${parseFloat(pos.positionValue).toFixed(2)}
      </td>
      <td className={`px-4 py-3 text-right font-mono font-bold ${pnl >= 0 ? "text-[#20e6a3]" : "text-[#ff4a6b]"}`}>
        {pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}
      </td>
      <td className={`px-4 py-3 text-right font-mono font-bold ${roe >= 0 ? "text-[#20e6a3]" : "text-[#ff4a6b]"}`}>
        {roe >= 0 ? "+" : ""}{roe.toFixed(2)}%
      </td>
    </tr>
  );
}

function EmptyState({
  text,
  cta,
  href,
}: {
  text: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="bg-[#0e1114] rounded-xl border border-[#171c22] py-10 flex flex-col items-center gap-3 text-neutral-600">
      <p className="text-sm">{text}</p>
      <Link
        href={href}
        className="text-[#20e6a3] text-xs font-bold hover:underline"
      >
        {cta} →
      </Link>
    </div>
  );
}