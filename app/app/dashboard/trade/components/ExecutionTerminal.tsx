"use client";
// ExecutionTerminal.tsx – Order placement panel (Hyperliquid-style)

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useHyperliquidOrder } from "@/hooks/useHyperliquidOrder";
import { MAX_LEVERAGE } from "@/lib/config";
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, Wallet, ChevronDown } from "lucide-react";

interface Props { coin: string; markPrice: number }

type OrderTab    = "market" | "limit";
type MarginMode  = "cross"  | "isolated";

export function ExecutionTerminal({ coin, markPrice }: Props) {
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const embedded = wallets.find(w => w.walletClientType === "privy");

  const { placeOrder, isPlacing, lastResult, account, loadingAccount } = useHyperliquidOrder();

  const [tab,        setTab]        = useState<OrderTab>("market");
  const [marginMode, setMarginMode] = useState<MarginMode>("cross");
  const [side,       setSide]       = useState<"buy" | "sell">("buy");
  const [leverage,   setLeverage]   = useState(10);
  const [sizeInput,  setSizeInput]  = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [tpInput,    setTpInput]    = useState("");
  const [slInput,    setSlInput]    = useState("");
  const [showTpSl,   setShowTpSl]   = useState(false);

  const maxLev   = MAX_LEVERAGE[coin] ?? 20;
  const sizeNum  = parseFloat(sizeInput)  || 0;
  const priceNum = tab === "market" ? markPrice : (parseFloat(priceInput) || markPrice);
  const notional = sizeNum * priceNum;
  const estMargin = leverage > 0 ? notional / leverage : notional;
  const available = parseFloat(account?.withdrawable ?? "0");

  // Pre-fill limit price
  useEffect(() => {
    if (tab === "limit" && markPrice > 0 && !priceInput)
      setPriceInput(markPrice.toFixed(2));
  }, [tab, markPrice]);

  // Quick-fill size from % of buying power
  const fillPct = (pct: number) => {
    const maxSize = (available * leverage) / (markPrice || 1);
    setSizeInput(((maxSize * pct) / 100).toFixed(4));
  };

  const handleSubmit = async () => {
    if (!sizeInput || sizeNum <= 0) return;
    await placeOrder({
      coin, side, orderType: tab,
      size: sizeInput,
      price: tab === "limit" ? priceInput : undefined,
      leverage,
      tp: tpInput || undefined,
      sl: slInput || undefined,
    });
    setSizeInput(""); setTpInput(""); setSlInput("");
  };

  const liqPriceEst = () => {
    if (!sizeNum || !markPrice) return null;
    return side === "buy"
      ? (markPrice * (1 - 0.9 / leverage)).toFixed(2)
      : (markPrice * (1 + 0.9 / leverage)).toFixed(2);
  };

  if (!ready) return (
    <div className="w-full h-full flex items-center justify-center bg-[#0e1114]">
      <Loader2 size={16} className="animate-spin text-[#20e6a3]" />
    </div>
  );

  if (!authenticated) return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-5 bg-[#0e1114]">
      <Wallet size={26} className="text-[#20e6a3]" />
      <p className="text-white font-bold text-sm text-center">Sign in to Trade</p>
      <p className="text-[#566273] text-[11px] text-center leading-relaxed">
        Get a non-custodial Ethereum wallet in&nbsp;10&nbsp;seconds
      </p>
      <button onClick={login}
        className="w-full py-2.5 bg-[#20e6a3] text-black font-black text-xs uppercase tracking-wider rounded-lg hover:bg-[#1bd89a] transition-colors">
        Connect / Sign In
      </button>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col bg-[#0e1114] overflow-y-auto text-xs min-h-0">

      {/* Wallet strip */}
      <div className="px-3 py-2 border-b border-[#171c22] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#20e6a3] pulse-dot" />
          <span className="text-[#20e6a3] font-mono text-[10px]">
            {embedded ? `${embedded.address.slice(0,6)}…${embedded.address.slice(-4)}` : "Ready"}
          </span>
        </div>
        <span className="text-neutral-500 font-mono text-[10px]">
          {loadingAccount
            ? <Loader2 size={10} className="animate-spin" />
            : `$${parseFloat(account?.accountValue ?? "0").toFixed(2)}`}
        </span>
      </div>

      <div className="px-3 pt-2.5 pb-3 space-y-2.5">

        {/* Margin mode */}
        <div className="grid grid-cols-3 gap-1">
          {(["cross","isolated"] as const).map(m => (
            <button key={m} onClick={() => setMarginMode(m)}
              className={`py-1 rounded text-[10px] font-bold border col-span-1 transition-colors ${
                marginMode === m
                  ? "border-[#20e6a3] text-[#20e6a3] bg-[#20e6a3]/5"
                  : "border-[#262f3a] text-neutral-500 bg-[#12161a] hover:text-white"
              }`}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
          <div className="bg-[#12161a] border border-[#262f3a] py-1 rounded text-[10px] text-[#20e6a3] font-black text-center">
            {leverage}×
          </div>
        </div>

        {/* Leverage slider */}
        <div>
          <div className="flex justify-between text-[9px] text-[#566273] mb-1">
            <span>1×</span>
            <span>{Math.round(maxLev / 2)}×</span>
            <span>{maxLev}×</span>
          </div>
          <input type="range" min={1} max={maxLev} value={leverage}
            onChange={e => setLeverage(Number(e.target.value))}
            className="w-full h-1 cursor-pointer" />
        </div>

        {/* Order type tabs */}
        <div className="grid grid-cols-2 border-b border-[#171c22] text-[11px] font-bold">
          {(["market","limit"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-1.5 transition-colors ${
                tab === t ? "text-white border-b-2 border-white" : "text-[#566273] hover:text-white"
              }`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Buy / Sell */}
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-black/40 rounded border border-[#171c22]">
          {(["buy","sell"] as const).map(s => (
            <button key={s} onClick={() => setSide(s)}
              className={`py-2 rounded text-[11px] font-black uppercase tracking-wide transition-colors ${
                side === s
                  ? s === "buy" ? "bg-[#20e6a3] text-black" : "bg-[#ff4a6b] text-white"
                  : "text-[#566273] hover:text-white"
              }`}>
              {s === "buy" ? "Buy / Long" : "Sell / Short"}
            </button>
          ))}
        </div>

        {/* Price input (limit) */}
        {tab === "limit" && (
          <NumberInput
            label="Price (USDC)"
            value={priceInput}
            onChange={setPriceInput}
            placeholder={markPrice.toFixed(2)}
            right="USDC"
          />
        )}

        {/* Size input */}
        <NumberInput
          label={`Size (${coin})`}
          value={sizeInput}
          onChange={setSizeInput}
          placeholder="0.0000"
          right={coin}
        />

        {/* Quick-fill % */}
        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map(p => (
            <button key={p} onClick={() => fillPct(p)}
              className="bg-[#12161a] hover:bg-[#1a2028] text-[#566273] hover:text-white py-0.5 rounded text-[10px] border border-[#262f3a] transition-colors">
              {p}%
            </button>
          ))}
        </div>

        {/* TP / SL toggle */}
        <button onClick={() => setShowTpSl(v => !v)}
          className="flex items-center gap-1.5 text-[10px] text-[#566273] hover:text-white transition-colors">
          <span className="text-[#20e6a3] font-bold">{showTpSl ? "−" : "+"}</span>
          Take Profit / Stop Loss
        </button>

        {showTpSl && (
          <div className="grid grid-cols-2 gap-2">
            <NumberInput label="TP Price" value={tpInput} onChange={setTpInput} placeholder="—" right="" labelColor="text-[#20e6a3]" />
            <NumberInput label="SL Price" value={slInput} onChange={setSlInput} placeholder="—" right="" labelColor="text-[#ff4a6b]" />
          </div>
        )}

        {/* Summary */}
        <div className="space-y-1 pt-1 border-t border-[#171c22] text-[10px] font-mono">
          <SummaryRow k="Notional"   v={notional  > 0 ? `$${notional.toFixed(2)}`   : "—"} />
          <SummaryRow k="Est. Margin" v={estMargin > 0 ? `$${estMargin.toFixed(2)}`  : "—"} />
          <SummaryRow k="Liq. Price" v={liqPriceEst() ?? "—"} vc="text-[#ff4a6b]" />
        </div>

        {/* Submit */}
        <button onClick={handleSubmit}
          disabled={isPlacing || !sizeInput || sizeNum <= 0}
          className={`w-full py-3 rounded-lg text-[12px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            isPlacing || !sizeInput || sizeNum <= 0
              ? "opacity-40 cursor-not-allowed bg-neutral-800 text-neutral-500"
              : side === "buy"
                ? "bg-[#20e6a3] text-black hover:bg-[#1bd89a] active:scale-[0.98]"
                : "bg-[#ff4a6b] text-white hover:bg-[#e83d5e] active:scale-[0.98]"
          }`}>
          {isPlacing && <Loader2 size={12} className="animate-spin" />}
          {isPlacing ? "Placing…" : `${side === "buy" ? "Long" : "Short"} ${coin} ${leverage}×`}
        </button>

        {/* Result */}
        {lastResult && (
          <div className={`rounded-lg p-2.5 text-[11px] border fade-in ${
            lastResult.success
              ? "bg-[#20e6a3]/5 border-[#20e6a3]/20 text-[#20e6a3]"
              : "bg-[#ff4a6b]/5 border-[#ff4a6b]/20 text-[#ff4a6b]"
          }`}>
            <div className="flex items-center gap-1.5 font-bold">
              {lastResult.success
                ? <><CheckCircle2 size={12} /> Filled{lastResult.orderId ? ` #${lastResult.orderId}` : ""}</>
                : <><AlertTriangle size={12} /> Failed</>}
            </div>
            {lastResult.success && lastResult.explorerUrl && (
              <a href={lastResult.explorerUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 mt-1 underline opacity-80 hover:opacity-100 text-[10px]">
                HL Explorer <ExternalLink size={9} />
              </a>
            )}
            {!lastResult.success && (
              <p className="mt-0.5 text-[9px] opacity-70 break-all">{lastResult.error}</p>
            )}
          </div>
        )}
      </div>

      {/* Open Positions */}
      {account && account.positions.length > 0 && (
        <div className="border-t border-[#171c22] px-3 pt-2 pb-3 space-y-2 shrink-0">
          <p className="text-[10px] text-[#566273] font-bold uppercase">
            Positions ({account.positions.length})
          </p>
          {account.positions.map(pos => {
            const isLong = parseFloat(pos.szi) > 0;
            const pnl = parseFloat(pos.unrealizedPnl);
            const roe = parseFloat(pos.returnOnEquity) * 100;
            return (
              <div key={pos.coin} className="bg-[#12161a] rounded-lg p-2 border border-[#1c2228]">
                <div className="flex items-center justify-between">
                  <span className="text-white font-bold">{pos.coin}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isLong ? "bg-[#20e6a3]/10 text-[#20e6a3]" : "bg-[#ff4a6b]/10 text-[#ff4a6b]"
                  }`}>
                    {isLong ? "LONG" : "SHORT"} {pos.leverage.value}×
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 mt-1.5 text-[10px] font-mono">
                  <Row k="Entry" v={`$${parseFloat(pos.entryPx).toFixed(2)}`} />
                  <Row k="Size"  v={Math.abs(parseFloat(pos.szi)).toFixed(4)} />
                  <Row k="PnL"   v={`${pnl>=0?"+":""}$${pnl.toFixed(2)}`} vc={pnl>=0?"text-[#20e6a3]":"text-[#ff4a6b]"} />
                  <Row k="ROE"   v={`${roe>=0?"+":""}${roe.toFixed(2)}%`}  vc={roe>=0?"text-[#20e6a3]":"text-[#ff4a6b]"} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NumberInput({ label, value, onChange, placeholder, right, labelColor = "text-[#566273]" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; right: string; labelColor?: string;
}) {
  return (
    <div>
      <span className={`text-[10px] font-bold uppercase ${labelColor}`}>{label}</span>
      <div className="relative mt-0.5">
        <input type="number" value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black border border-[#262f3a] rounded-lg px-2.5 py-1.5 text-right text-white font-bold text-xs focus:outline-none focus:border-[#20e6a3] transition-colors pr-10" />
        {right && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#566273] font-mono text-[10px]">
            {right}
          </span>
        )}
      </div>
    </div>
  );
}
function SummaryRow({ k, v, vc = "text-neutral-300" }: { k: string; v: string; vc?: string }) {
  return (
    <div className="flex justify-between text-[#566273]">
      <span>{k}</span>
      <span className={vc}>{v}</span>
    </div>
  );
}
function Row({ k, v, vc = "text-neutral-300" }: { k: string; v: string; vc?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#566273]">{k}</span>
      <span className={vc}>{v}</span>
    </div>
  );
}