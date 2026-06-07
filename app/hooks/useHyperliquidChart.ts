import { useEffect, useState, useRef } from "react";

export interface CandleFrame {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseHyperliquidChartProps {
  proxyRestUrl: string;
  proxyWsUrl: string;
  coin: string;
  interval: string; // e.g., "1m", "5m", "1h"
}

export const useHyperliquidChart = ({
  proxyRestUrl,
  proxyWsUrl,
  coin,
  interval,
}: UseHyperliquidChartProps) => {
  const [chartData, setChartData] = useState<CandleFrame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const dataMapRef = useRef<Map<number, CandleFrame>>(new Map());

  // Helper to format raw Hyperliquid frames into clean number objects
  const transformRawCandle = (raw: any): CandleFrame => ({
    time: Math.floor(Number(raw.t) / 1000), // Force millisecond to second conversion
    open: parseFloat(raw.o),
    high: parseFloat(raw.h),
    low: parseFloat(raw.l),
    close: parseFloat(raw.c),
    volume: parseFloat(raw.v),
  });

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    dataMapRef.current.clear();

    // STEP 1: Bootstrapping Historical Data via REST Proxy Channel
    const seedHistoricalData = async () => {
      try {
        const response = await fetch(`${proxyRestUrl}/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "candleSnapshot",
            req: { coin, interval, startTime: Date.now() - 200 * 60 * 60 * 1000 }, // Past 200 bars
          }),
        });

        if (!response.ok) throw new Error("Failed to pull historical coordinate snapshot.");
        const rawCandles = await response.json();

        if (Array.isArray(rawCandles)) {
          const sanitized = rawCandles.map(transformRawCandle);
          sanitized.forEach((candle) => dataMapRef.current.set(candle.time, candle));
          
          if (isMounted) {
            setChartData(Array.from(dataMapRef.current.values()).sort((a, b) => a.time - b.time));
            setIsLoading(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Unknown data pipeline disruption");
          setIsLoading(false);
        }
      }
    };

    // STEP 2: Establishing Real-time Delta Stream Alignment
    const connectStreamLoop = () => {
      wsRef.current = new WebSocket(proxyWsUrl);

      wsRef.current.onopen = () => {
        // Subscribe payload mapped for Hyperliquid structure via your proxy router
        wsRef.current?.send(
          JSON.stringify({
            method: "subscribe",
            subscription: { type: "candles", coin, interval },
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          // Verify frame contains candle data updates
          if (message.channel === "candles" && message.data) {
            const liveCandle = transformRawCandle(message.data);
            
            // Mutate local matrix buffer map to keep memory footprint O(1)
            dataMapRef.current.set(liveCandle.time, liveCandle);

            // Re-render coordinate series keeping arrays sorted chronologically
            setChartData(
              Array.from(dataMapRef.current.values()).sort((a, b) => a.time - b.time)
            );
          }
        } catch (parseErr) {
          // Fallthrough to prevent proxy loop failure on unhandled frames
        }
      };

      wsRef.current.onclose = () => {
        if (isMounted) setTimeout(connectStreamLoop, 5000); // Resilient reconnect loop
      };
    };

    seedHistoricalData().then(() => {
      if (isMounted) connectStreamLoop();
    });

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
    };
  }, [proxyRestUrl, proxyWsUrl, coin, interval]);

  return { chartData, isLoading, error };
};