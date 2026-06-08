"use client";
// hooks/useHyperliquidStream.ts
//
// CHANGES FROM ORIGINAL:
//   1. Reads PROXY_CONFIG from config.ts — no more hard-coded localhost strings
//   2. Subscribes to allMids for live mark-price updates (was missing entirely)
//   3. Routes REST candle requests through the Rust proxy (/info endpoint)
//   4. Subscription format already matched HL native {method,subscription} — no change needed
//   5. Improved reconnection: tracks shouldReconnect flag to prevent zombie retries
//   6. Price now updated from allMids stream, not only from order-book mid calculation

import { useEffect, useState, useRef, useCallback } from "react";
import { PROXY_CONFIG } from "@/lib/config";

// ─── Public types ─────────────────────────────────────────────────────────────

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

export interface StreamState {
  isConnected: boolean;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  maxBookTotal: number;
  recentTrades: PublicTrade[];
  markPrice: number;
  indexPrice: number;
  spread: { absolute: number; percent: number };
  /** Ref to full candle history (avoids React render on every frame) */
  candleHistoryRef: React.MutableRefObject<CandleData[]>;
  /** Ref to current live price (avoids React render on every tick) */
  currentPriceRef: React.MutableRefObject<number>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHyperliquidStream(coin: string): StreamState {
  const proxyWsUrl = PROXY_CONFIG.wsUrl;
  const proxyRestUrl = PROXY_CONFIG.restUrl;

  // React state (triggers re-renders at 100 ms throttle)
  const [isConnected, setIsConnected] = useState(false);
  const [bids, setBids] = useState<OrderbookLevel[]>([]);
  const [asks, setAsks] = useState<OrderbookLevel[]>([]);
  const [maxBookTotal, setMaxBookTotal] = useState(1);
  const [recentTrades, setRecentTrades] = useState<PublicTrade[]>([]);
  const [markPrice, setMarkPrice] = useState(0);
  const [indexPrice, setIndexPrice] = useState(0);
  const [spread, setSpread] = useState({ absolute: 0, percent: 0 });

  // High-frequency mutable refs (updated on every WS frame, no re-render)
  const rawBidsRef = useRef<any[]>([]);
  const rawAsksRef = useRef<any[]>([]);
  const tradesRef = useRef<PublicTrade[]>([]);
  const currentPriceRef = useRef<number>(0);
  const candleHistoryRef = useRef<CandleData[]>([]);

  // ── 1. Historical candle bootstrap via REST proxy ──────────────────────────
  useEffect(() => {
    let alive = true;

    async function fetchCandles() {
      try {
        const res = await fetch(`${proxyRestUrl}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "candleSnapshot",
            req: {
              coin: coin.toUpperCase(),
              interval: "1h",
              startTime: Date.now() - 200 * 60 * 60 * 1000,
            },
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const records = await res.json();

        if (Array.isArray(records) && alive) {
          const formatted: CandleData[] = records
            .map((r: any) => ({
              time: Math.floor(Number(r.t) / 1000), // unix seconds for lightweight-charts
              open: parseFloat(r.o),
              high: parseFloat(r.h),
              low: parseFloat(r.l),
              close: parseFloat(r.c),
              volume: parseFloat(r.v),
            }))
            .sort((a, b) => a.time - b.time);

          candleHistoryRef.current = formatted;

          if (formatted.length > 0) {
            const last = formatted[formatted.length - 1].close;
            if (currentPriceRef.current === 0) {
              currentPriceRef.current = last;
              setMarkPrice(last);
            }
          }
        }
      } catch (err) {
        console.warn("[HL Stream] Candle fetch failed:", err);
      }
    }

    fetchCandles();
    return () => {
      alive = false;
    };
  }, [coin, proxyRestUrl]);

  // ── 2. Live WebSocket stream ───────────────────────────────────────────────
  useEffect(() => {
    let ws: WebSocket;
    let pingTimer: ReturnType<typeof setInterval>;
    let uiTimer: ReturnType<typeof setInterval>;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let shouldReconnect = true;

    function connect() {
      console.info(`[HL Stream] Connecting to ${proxyWsUrl} for ${coin}`);
      ws = new WebSocket(proxyWsUrl);

     ws.onopen = () => {
    console.info("[HL Stream] WebSocket handshake successful ✅");
    setIsConnected(true);

        // ─ Subscribe to allMids (global mark prices) ─
        ws.send(
          JSON.stringify({ method: "subscribe", subscription: { type: "allMids" } })
        );
        // ─ Subscribe to L2 order book ─
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "l2Book", coin: coin.toUpperCase() },
          })
        );
        // ─ Subscribe to trade tape ─
        ws.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "trades", coin: coin.toUpperCase() },
          })
        );

        // Keepalive ping every 20 s
        pingTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ method: "ping" }));
          }
        }, 20_000);
      };

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string);
          if (!msg?.channel) return;

          switch (msg.channel) {
            // ─ allMids: update live mark price ─
            case "allMids": {
              const price = msg.data?.mids?.[coin.toUpperCase()];
              if (price) {
                currentPriceRef.current = parseFloat(price);
              }
              break;
            }

            // ─ L2 book update ─
            case "l2Book": {
              if (msg.data?.coin?.toUpperCase() === coin.toUpperCase()) {
                rawBidsRef.current = msg.data.levels?.[0] ?? [];
                rawAsksRef.current = msg.data.levels?.[1] ?? [];
              }
              break;
            }

            // ─ Trade tape ─
            case "trades": {
              if (!Array.isArray(msg.data)) break;
              const parsed: PublicTrade[] = msg.data
                .filter((t: any) => t.coin?.toUpperCase() === coin.toUpperCase())
                .map((t: any) => ({
                  id: `${t.tid}-${t.time}`,
                  time: new Date(t.time).toLocaleTimeString([], {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  }),
                  price: parseFloat(t.px),
                  size: parseFloat(t.sz),
                  side: t.side === "B" ? ("buy" as const) : ("sell" as const),
                }));

              if (parsed.length > 0) {
                tradesRef.current = [...parsed, ...tradesRef.current].slice(0, 50);
                // Update price from last trade as fallback
                if (currentPriceRef.current === 0) {
                  currentPriceRef.current = parsed[0].price;
                }
              }
              break;
            }

            default:
              break;
          }
        } catch (err) {
          console.error("[HL Stream] Parse error:", err);
        }
      };

     ws.onerror = (err) => {
    // The empty {} happens because the Event object is stripped.
    // Instead, log the readyState to differentiate between 
    // "Failed to connect" and "Disconnected while active"
    console.error(`[HL Stream] WebSocket error occurred. ReadyState: ${ws.readyState}`);
  };

     ws.onclose = (ev) => {
    // If code is 1006, it means the connection was closed abnormally 
    // (often because the server rejected the connection).
    console.warn(`[HL Stream] Closed. Code: ${ev.code}, Reason: ${ev.reason || "None"}`);
    setIsConnected(false);
        clearInterval(pingTimer);
        if (shouldReconnect) {
          reconnectTimer = setTimeout(connect, 3_000);
        }
      };
    }

    connect();

    // ── 3. UI throttle loop: flush refs → React state every 100 ms ───────────
     uiTimer = setInterval(() => {
      const rawBids = rawBidsRef.current;
      const rawAsks = rawAsksRef.current;

      let processedBids: OrderbookLevel[] = [];
      let processedAsks: OrderbookLevel[] = [];
      let bidTotal = 0;
      let askTotal = 0;

      if (rawBids.length > 0 || rawAsks.length > 0) {
        processedBids = rawBids.slice(0, 15).map((item: any) => {
          const size = parseFloat(item.sz);
          bidTotal += size;
          return { price: parseFloat(item.px), size, total: bidTotal };
        });

        processedAsks = rawAsks.slice(0, 15).map((item: any) => {
          const size = parseFloat(item.sz);
          askTotal += size;
          return { price: parseFloat(item.px), size, total: askTotal };
        });

        const topBid = processedBids[0]?.price ?? 0;
        const topAsk = processedAsks[0]?.price ?? 0;

        if (topBid > 0 && topAsk > 0) {
          const spreadAbs = Math.abs(topAsk - topBid);
          const mid = (topBid + topAsk) / 2;
          setSpread({
            absolute: spreadAbs,
            percent: mid > 0 ? (spreadAbs / mid) * 100 : 0,
          });
        }
      }

      const livePrice = currentPriceRef.current;
      if (livePrice > 0) {
        setMarkPrice(livePrice);
      }

      setBids(processedBids);
      setAsks(processedAsks);
      setMaxBookTotal(Math.max(bidTotal, askTotal) || 1);
      setRecentTrades([...tradesRef.current]);
    }, 100);

    return () => {
      shouldReconnect = false;
      clearInterval(uiTimer);
      clearInterval(pingTimer);
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [coin, proxyWsUrl]);

  return {
    isConnected,
    bids,
    asks,
    maxBookTotal,
    recentTrades,
    markPrice,
    indexPrice,
    spread,
    candleHistoryRef,
    currentPriceRef,
  };
}