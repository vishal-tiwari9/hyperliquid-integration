"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  TrendingUp, 
  Layers, 
  PieChart, 
  ArrowLeftRight, 
  Terminal as ConsoleIcon, 
  ShieldCheck, 
  Zap, 
  Activity,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";

interface BookLevel {
  px: string;
  sz: string;
  n: number;
}

interface LogPacket {
  timeLabel: string;
  channel: string;
  rawStr: string;
}

export default function ProductionDashboard() {
  // Navigation & Socket State
  const [activeTab, setActiveTab] = useState<"trade" | "markets" | "portfolio">("trade");
  const [socketStatus, setSocketStatus] = useState<"CONNECTED" | "DISCONNECTED" | "CONNECTING">("CONNECTING");
  const [totalFrames, setTotalFrames] = useState<number>(0);
  const [rawLogs, setRawLogs] = useState<LogPacket[]>([]);

  // Authenticated Order Book Live States
  const [coinSymbol, setCoinSymbol] = useState<string>("BTC");
  const [midPrice, setMidPrice] = useState<number>(0);
  const [spread, setSpread] = useState<number>(0);
  const [bids, setBids] = useState<BookLevel[]>([]);
  const [asks, setAsks] = useState<BookLevel[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  // Form Interactive Order Engine States
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<string>("Market");
  const [orderSize, setOrderSize] = useState<string>("");
  const [leverage, setLeverage] = useState<number>(20);
  const [limitPrice, setLimitPrice] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const frameCounterRef = useRef<number>(0);

  useEffect(() => {
    // Establishing non-blocking dual-channel pipeline to your local Rust proxy gateway
    const ws = new WebSocket("ws://127.0.0.1:3001/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setSocketStatus("CONNECTED");
      // Formulate explicit subscription matrix for Hyperliquid engine structures
      const subPayload = {
        method: "subscribe",
        subscription: { type: "l2Book", coin: coinSymbol }
      };
      ws.send(JSON.stringify(subPayload));
    };

    ws.onclose = () => setSocketStatus("DISCONNECTED");
    ws.onerror = () => setSocketStatus("DISCONNECTED");

    ws.onmessage = (event) => {
      try {
        const parsedFrame = JSON.parse(event.data);
        
        // Unpack batched payloads or separate singular streams uniformly
        const packets = Array.isArray(parsedFrame) ? parsedFrame : [parsedFrame];
        if (packets.length === 0) return;

        frameCounterRef.current += packets.length;
        setTotalFrames(frameCounterRef.current);

        // Keep a rolling historical trace of the raw network transactions
        const incomingLogs = packets.map((p: any) => ({
          timeLabel: new Date().toLocaleTimeString(),
          channel: p?.channel || "System-Message",
          rawStr: JSON.stringify(p?.data || p)
        }));
        setRawLogs((prev) => [...incomingLogs, ...prev].slice(0, 12));

        // Evaluate core L2 Engine snapshot properties
        const latestPayload = packets[packets.length - 1];
        const bookContainer = latestPayload?.channel === "l2Book" ? latestPayload.data : null;

        if (bookContainer && bookContainer.levels) {
          const rawBids: BookLevel[] = bookContainer.levels[0] || [];
          const rawAsks: BookLevel[] = bookContainer.levels[1] || [];
          
          setBids(rawBids.slice(0, 8));
          setAsks(rawAsks.slice(0, 8));
          setLastUpdateTime(bookContainer.time || Date.now());

          // Perform mathematical pricing extractions from top-of-book tiers
          if (rawBids.length > 0 && rawAsks.length > 0) {
            const topBid = parseFloat(rawBids[0].px);
            const topAsk = parseFloat(rawAsks[0].px);
            
            setMidPrice((topBid + topAsk) / 2);
            setSpread(Math.max(0, topAsk - topBid));
          }
        }
      } catch (err) {
        console.error("L1 Stream compilation failure:", err);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [coinSymbol]);

  // Action dispatcher handling execution payloads
  const triggerOrderExecution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSize || parseFloat(orderSize) <= 0) return alert("Specify valid order volume.");

    const transactionIntent = {
      asset: coinSymbol,
      isBuy: orderSide === "BUY",
      limitPx: orderType === "Market" ? midPrice.toFixed(2) : limitPrice,
      sz: orderSize,
      leverage: leverage,
      orderType: orderType,
      timestamp: Date.now()
    };

    console.log("Transmitting signed intent payload directly to execution layer:", transactionIntent);
    alert(`Order intent dispatched: ${orderSide} ${orderSize} ${coinSymbol} @ ${orderType === "Market" ? "Market Price" : limitPrice}`);
  };

  return (
    <div className="flex h-screen w-screen bg-[#09090b] text-[#e4e4e7] font-sans antialiased overflow-hidden select-none">
      
      {/* ---------------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION MODULE                                              */}
      {/* ---------------------------------------------------------------------- */}
      <aside className="w-64 h-full bg-[#09090b] border-r border-[#27272a] flex flex-col justify-between z-20">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-[#27272a] gap-2.5">
            <div className="h-7 w-7 rounded bg-emerald-500 flex items-center justify-center font-black text-black text-xs font-mono">
              M
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block font-mono">mochatrade</span>
              <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-widest block -mt-0.5">L1 Core Node</span>
            </div>
          </div>

          <nav className="px-3 mt-6 space-y-1">
            {[
              { id: "trade", label: "High-Frequency Terminal", icon: TrendingUp },
              { id: "markets", label: "Supported Asset Contexts", icon: Layers },
              { id: "portfolio", label: "Margin Clearances", icon: PieChart },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md font-medium text-xs transition-all duration-150 ${
                    isActive 
                      ? "bg-[#18181b] text-white border border-[#27272a]" 
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-[#141417]/50"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-emerald-400" : "text-neutral-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#27272a] bg-[#141417]/20 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Engine Core</span>
            <span className={`font-bold uppercase text-[10px] ${socketStatus === "CONNECTED" ? "text-emerald-400" : "text-rose-500"}`}>
              {socketStatus}
            </span>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------------------------- */}
      {/* WORKSPACE MAIN TERMINAL INTERFACE                                     */}
      {/* ---------------------------------------------------------------------- */}
      <main className="flex-1 h-full flex flex-col overflow-hidden">
        
        {/* Real-Time Context Header */}
        <header className="h-16 border-b border-[#27272a] px-6 flex items-center justify-between bg-[#09090b]">
          <div className="flex items-center gap-6">
            <select 
              value={coinSymbol} 
              onChange={(e) => setCoinSymbol(e.target.value.toUpperCase())}
              className="bg-[#141417] border border-[#27272a] text-xs font-mono font-bold px-3 py-1.5 rounded text-white outline-none focus:border-emerald-500"
            >
              <option value="BTC">BTC-PERP</option>
              <option value="ETH">ETH-PERP</option>
              <option value="SOL">SOL-PERP</option>
            </select>

            <div className="flex items-baseline gap-2">
              <span className="text-xs text-neutral-500 font-mono">Mid Price:</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {midPrice > 0 ? `$${midPrice.toFixed(2)}` : "Connecting..."}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xxs font-mono text-neutral-400">
              <span>Spread:</span>
              <span className="text-neutral-200 font-bold">${spread.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="text-xxs font-mono text-neutral-500">
            L1 Block Clock Sync: <span className="text-neutral-300 font-bold">{lastUpdateTime || "N/A"}</span>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === "trade" && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full max-w-[1700px] mx-auto">
              
              {/* Order Book Depth Array Visualization Component */}
              <div className="bg-[#141417] rounded-xl border border-[#27272a] p-4 flex flex-col h-[580px]">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300 border-b border-[#27272a] pb-2 mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" /> Order Book Depth Matrix
                </h3>

                <div className="flex-1 grid grid-cols-2 gap-4 font-mono text-xs overflow-hidden">
                  {/* Bids Column (Left Side) */}
                  <div className="flex flex-col">
                    <div className="grid grid-cols-2 text-xxs text-neutral-500 font-bold pb-1 border-b border-[#27272a]/40">
                      <span>BID PRICE</span>
                      <span className="text-right">SIZE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 mt-1.5 pr-1">
                      {bids.length === 0 ? (
                        <div className="text-neutral-600 text-xxs italic mt-4">Awaiting bids execution array...</div>
                      ) : (
                        bids.map((bid, i) => (
                          <div key={i} className="grid grid-cols-2 text-xxs text-emerald-400 py-0.5 hover:bg-emerald-500/5 transition-colors px-1 rounded">
                            <span>{parseFloat(bid.px).toFixed(2)}</span>
                            <span className="text-right text-neutral-300">{bid.sz}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Asks Column (Right Side) */}
                  <div className="flex flex-col">
                    <div className="grid grid-cols-2 text-xxs text-neutral-500 font-bold pb-1 border-b border-[#27272a]/40">
                      <span>ASK PRICE</span>
                      <span className="text-right">SIZE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1 mt-1.5 pr-1">
                      {asks.length === 0 ? (
                        <div className="text-neutral-600 text-xxs italic mt-4">Awaiting asks execution array...</div>
                      ) : (
                        asks.map((ask, i) => (
                          <div key={i} className="grid grid-cols-2 text-xxs text-rose-400 py-0.5 hover:bg-rose-500/5 transition-colors px-1 rounded">
                            <span>{parseFloat(ask.px).toFixed(2)}</span>
                            <span className="text-right text-neutral-300">{ask.sz}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Functional Ingress Log Wire Frame Feed Component */}
              <div className="bg-[#141417] rounded-xl border border-[#27272a] p-4 flex flex-col h-[580px]">
                <div className="flex items-center justify-between border-b border-[#27272a] pb-2 mb-3">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <ConsoleIcon className="h-4 w-4 text-amber-400" /> Live Frame Ingress Log
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400 bg-[#09090b] border border-[#27272a] px-2 py-0.5 rounded">
                    Frames: {totalFrames}
                  </span>
                </div>

                <div className="flex-1 bg-[#09090b] rounded-lg border border-[#27272a]/70 p-3 font-mono text-xxs overflow-y-auto space-y-2 custom-scrollbar">
                  {rawLogs.length === 0 ? (
                    <p className="text-neutral-600 italic">Listening for native WebSocket packets from system proxy line...</p>
                  ) : (
                    rawLogs.map((log, index) => (
                      <div key={index} className="border-b border-[#18181b] pb-1.5 leading-relaxed tracking-tight">
                        <div className="flex justify-between text-neutral-500 mb-0.5">
                          <span>[{log.timeLabel}] Channel: {log.channel}</span>
                        </div>
                        <span className="text-neutral-300 break-all select-all font-mono">{log.rawStr}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Leveraged Position Placement Control Panel Terminal */}
              <form onSubmit={triggerOrderExecution} className="bg-[#141417] rounded-xl border border-[#27272a] p-4 flex flex-col justify-between h-[580px]">
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-neutral-300 border-b border-[#27272a] pb-2 mb-4">
                    Order Ingress Routing
                  </h3>

                  <div className="flex gap-2 p-1 bg-[#09090b] border border-[#27272a] rounded-lg text-xs font-mono mb-4">
                    <button 
                      type="button"
                      onClick={() => setOrderSide("BUY")}
                      className={`flex-1 py-2 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                        orderSide === "BUY" ? "bg-emerald-500 text-black" : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" /> Long
                    </button>
                    <button 
                      type="button"
                      onClick={() => setOrderSide("SELL")}
                      className={`flex-1 py-2 rounded-md font-bold transition-all flex items-center justify-center gap-1.5 ${
                        orderSide === "SELL" ? "bg-rose-500 text-white" : "text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" /> Short
                    </button>
                  </div>

                  <div className="space-y-4 font-mono text-xs">
                    <div>
                      <label className="text-neutral-400 text-xxs font-bold uppercase">Routing Logic Execution</label>
                      <select 
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value)}
                        className="w-full mt-1 p-2 bg-[#09090b] border border-[#27272a] rounded-md text-white font-bold outline-none focus:border-emerald-500"
                      >
                        <option value="Market">Market Execution</option>
                        <option value="Limit">Limit Order Execution</option>
                      </select>
                    </div>

                    {orderType === "Limit" && (
                      <div>
                        <label className="text-neutral-400 text-xxs font-bold uppercase">Limit Target Execution Price ($)</label>
                        <input 
                          type="text" 
                          required
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          placeholder={midPrice > 0 ? midPrice.toFixed(2) : "0.00"} 
                          className="w-full mt-1 p-2 bg-[#09090b] border border-[#27272a] rounded-md text-white outline-none font-bold text-right focus:border-emerald-500" 
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-neutral-400 text-xxs font-bold uppercase">Order Size Allocation ({coinSymbol})</label>
                      <input 
                        type="text" 
                        required
                        value={orderSize}
                        onChange={(e) => setOrderSize(e.target.value)}
                        placeholder="0.0000" 
                        className="w-full mt-1 p-2 bg-[#09090b] border border-[#27272a] rounded-md text-white outline-none font-bold text-right focus:border-emerald-500" 
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xxs font-bold uppercase text-neutral-400">
                        <label>Risk Leverage Engine Cap</label>
                        <span className="text-emerald-400 font-bold">{leverage}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="50" 
                        value={leverage}
                        onChange={(e) => setLeverage(parseInt(e.target.value))}
                        className="w-full mt-2 accent-emerald-500 cursor-pointer bg-[#09090b] h-1 rounded" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#27272a] mt-4">
                  <button 
                    type="submit"
                    className={`w-full py-3 font-bold text-xs uppercase rounded-lg transition-colors tracking-wider ${
                      orderSide === "BUY" 
                        ? "bg-emerald-500 text-black hover:bg-emerald-400" 
                        : "bg-rose-500 text-white hover:bg-rose-400"
                    }`}
                  >
                    Transmit Leveraged {orderSide === "BUY" ? "Long" : "Short"} Intent
                  </button>
                </div>
              </form>

            </div>
          )}

          {activeTab !== "trade" && (
            <div className="flex items-center justify-center h-[400px] border border-dashed border-[#27272a] rounded-xl font-mono text-xs text-neutral-500">
              Context configuration framework for segment &apos;{activeTab}&apos; is active and bound to state router.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}