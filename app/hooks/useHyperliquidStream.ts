"use client";

import { useEffect, useState, useRef } from "react";

export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
}

export interface PublicTrade {
  id: string;
  time: string;
  price: number;
  size: number;
  side: "buy" | "sell";
}

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseHyperliquidStreamProps {
  coin: string;
  proxyRestUrl: string; // Hyperliquid Info URL: e.g., https://api.hyperliquid.xyz
  proxyWsUrl: string;   // Hyperliquid WS URL: e.g., wss://api.hyperliquid.xyz/ws
}

export const useHyperliquidStream = ({ coin, proxyRestUrl, proxyWsUrl }: UseHyperliquidStreamProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [bids, setBids] = useState<OrderbookLevel[]>([]);
  const [asks, setAsks] = useState<OrderbookLevel[]>([]);
  const [maxBookTotal, setMaxBookTotal] = useState(1);
  const [recentTrades, setRecentTrades] = useState<PublicTrade[]>([]);
  const [markPrice, setMarkPrice] = useState(0);
  const [spread, setSpread] = useState({ absolute: 0, percent: 0 });

  // High-performance state buffers bypassing React renders
  const incomingBookRef = useRef<{ bids: any[]; asks: any[] }>({ bids: [], asks: [] });
  const incomingTradesRef = useRef<PublicTrade[]>([]);
  const candleHistoryRef = useRef<CandleData[]>([]);
  const currentPriceRef = useRef<number>(0);

  // 1. HTTP REST Fallback / Initialization Pipe
  useEffect(() => {
    let isMounted = true;
    
    const seedHistoricalData = async () => {
      try {
        const response = await fetch(`${proxyRestUrl}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "candleSnapshot",
            req: { coin, interval: "1h", startTime: Date.now() - 200 * 60 * 60 * 1000 },
          }),
        });
        
        const records = await response.json();
        
        if (Array.isArray(records) && isMounted) {
          const formatted = records.map((r: any) => ({
            time: Math.floor(Number(r.t) / 1000),
            open: parseFloat(r.o),
            high: parseFloat(r.h),
            low: parseFloat(r.l),
            close: parseFloat(r.c),
            volume: parseFloat(r.v),
          })).sort((a, b) => a.time - b.time);

          candleHistoryRef.current = formatted;
          if (formatted.length > 0) {
            const lastClose = formatted[formatted.length - 1].close;
            currentPriceRef.current = lastClose;
            setMarkPrice(lastClose);
          }
        }
      } catch (err) {
        console.error("REST initialization snapshot sync failed:", err);
      }
    };

    seedHistoricalData();
    return () => { isMounted = false; };
  }, [coin, proxyRestUrl]);

  // 2. High-Fidelity Active WebSocket Stream Connection Loop
  useEffect(() => {
    let ws: WebSocket;
    let pingInterval: NodeJS.Timeout;
    let uiSyncTimer: NodeJS.Timeout;
    let reconnectTimeout: NodeJS.Timeout;
    
    const connectWS = () => {
      console.log(`Establishing high-fidelity stream to endpoint: ${proxyWsUrl}`);
      ws = new WebSocket(proxyWsUrl);

      ws.onopen = () => {
        console.log("WebSocket gateway successfully connected.");
        setIsConnected(true);

        // SYSTEM FIX: Use Hyperliquid's exact subscription syntax format
        // Channel 1: L2 Liquidity Book Depth Matrix
        ws.send(JSON.stringify({
          method: "subscribe",
          subscription: { type: "l2Book", coin: coin.toUpperCase() }
        }));

        // Channel 2: Live Execution Tape Trades Tracker
        ws.send(JSON.stringify({
          method: "subscribe",
          subscription: { type: "trades", coin: coin.toUpperCase() }
        }));

        // Keep-Alive Loop: Prevents network gateways from dropping idle TCP connections
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: "ping" }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Verify we have received channel stream data matching our subscription specs
          if (!message || !message.channel) return;

          if (message.channel === "l2Book" && message.data?.coin === coin.toUpperCase()) {
            incomingBookRef.current = {
              bids: message.data.levels[0] || [],
              asks: message.data.levels[1] || [],
            };
          } 
          
          else if (message.channel === "trades" && Array.isArray(message.data)) {
            const parsedTrades: PublicTrade[] = message.data
              .filter((t: any) => t.coin === coin.toUpperCase())
              .map((t: any) => ({
                id: `${t.tid}-${t.time}`,
                time: new Date(t.time).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                price: parseFloat(t.px),
                size: parseFloat(t.sz),
                side: t.side === "B" ? "buy" : "sell", // B = Buy, Sell otherwise
              }));

            if (parsedTrades.length > 0) {
              // Prepend newest incoming executions to the tape matrix buffer
              incomingTradesRef.current = [...parsedTrades, ...incomingTradesRef.current].slice(0, 50);
            }
          }
        } catch (err) {
          console.error("Frame parsing abnormality encountered:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket sub-layer pipeline error:", error);
      };

      ws.onclose = (e) => {
        console.warn(`WebSocket closed [Code: ${e.code}]. Executing node recovery loop in 3s...`);
        setIsConnected(false);
        clearInterval(pingInterval);
        
        reconnectTimeout = setTimeout(() => {
          connectWS();
        }, 3000);
      };
    };

    connectWS();

    // 3. UI Multi-Thread Throttle Synchronization Loop (Fires every 100ms)
    uiSyncTimer = setInterval(() => {
      const rawBids = incomingBookRef.current.bids;
      const rawAsks = incomingBookRef.current.asks;

      let processedBids: OrderbookLevel[] = [];
      let processedAsks: OrderbookLevel[] = [];
      let accumulatedBidTotal = 0;
      let accumulatedAskTotal = 0;

      if (rawBids.length > 0 || rawAsks.length > 0) {
        // Map and format incoming raw bids
        processedBids = rawBids.slice(0, 15).map((item: any) => {
          const price = parseFloat(item.px);
          const size = parseFloat(item.sz);
          accumulatedBidTotal += size;
          return { price, size, total: accumulatedBidTotal };
        });

        // Map and format incoming raw asks
        processedAsks = rawAsks.slice(0, 15).map((item: any) => {
          const price = parseFloat(item.px);
          const size = parseFloat(item.sz);
          accumulatedAskTotal += size;
          return { price, size, total: accumulatedAskTotal };
        });

        const topBid = processedBids[0]?.price || currentPriceRef.current;
        const topAsk = processedAsks[0]?.price || currentPriceRef.current;
        const midPrice = (topBid + topAsk) / 2;

        currentPriceRef.current = midPrice;
        setMarkPrice(midPrice);

        const currentSpread = Math.abs(topAsk - topBid);
        setSpread({
          absolute: currentSpread,
          percent: midPrice > 0 ? (currentSpread / midPrice) * 100 : 0
        });
      } else {
        // Fallback to update data context if book buffer hasn't filled yet
        if (currentPriceRef.current > 0) {
          setMarkPrice(currentPriceRef.current);
        }
      }

      setBids(processedBids);
      setAsks(processedAsks);
      setMaxBookTotal(Math.max(accumulatedBidTotal, accumulatedAskTotal) || 1);
      setRecentTrades([...incomingTradesRef.current]);
    }, 100);

    return () => {
      clearInterval(uiSyncTimer);
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [coin, proxyWsUrl]);

  return { bids, asks, maxBookTotal, recentTrades, markPrice, spread, isConnected, candleHistoryRef, currentPriceRef };
};