"use client";
// app/dashboard/trade/components/TradingChart.tsx
//
// REWRITES:
//   1. BUG FIX: was `activeFrame.low = liveFrame` (undefined variable crash)
//      → now `activeFrame.low = livePrice`
//   2. Switched from raw-canvas to lightweight-charts (already in package.json)
//      — cleaner, interactive zoom/scroll, built-in price axis

import React, { useEffect, useRef, useCallback } from "react";
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  LineStyle,
  CandlestickData,
  Time,
  CandlestickSeries, // Add this
  HistogramSeries,   // Add this
} from "lightweight-charts";
import type { CandleData } from "@/hooks/useHyperliquidStream";
import { MousePointer, Plus, Maximize2, Trash2 } from "lucide-react";

interface TradingChartProps {
  coin: string;
  currentPriceRef: React.MutableRefObject<number>;
  candleHistoryRef: React.MutableRefObject<CandleData[]>;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  coin,
  currentPriceRef,
  candleHistoryRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastDataLenRef = useRef(0);

  // ─── Create chart once ─────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { color: "#07090b" },
        textColor: "#465362",
        fontFamily: "monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: "#12171c", style: LineStyle.Solid },
        horzLines: { color: "#12171c", style: LineStyle.Solid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#2a3340", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1a2130" },
        horzLine: { color: "#2a3340", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1a2130" },
      },
      rightPriceScale: {
        borderColor: "#171c22",
        textColor: "#465362",
      },
      timeScale: {
        borderColor: "#171c22",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
  upColor: "#1acc9b",
  downColor: "#ff4a6b",
  borderUpColor: "#1acc9b",
  borderDownColor: "#ff4a6b",
  wickUpColor: "#1acc9b",
  wickDownColor: "#ff4a6b",
});
   const volSeries = chart.addSeries(HistogramSeries, {
  color: "#1acc9b",
  priceFormat: { type: "volume" },
  priceScaleId: "volume",
});
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volumeSeriesRef.current = volSeries;

    // Resize observer
    const observer = new ResizeObserver(() => {
      chart.applyOptions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // ─── Load candle data when history becomes available ───────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const history = candleHistoryRef.current;
      const series = seriesRef.current;
      const volSeries = volumeSeriesRef.current;
      if (!series || !volSeries) return;

      if (history.length > 0 && history.length !== lastDataLenRef.current) {
        lastDataLenRef.current = history.length;

        const candleData: CandlestickData[] = history.map((c) => ({
          time: c.time as Time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }));

        const volumeData = history.map((c) => ({
          time: c.time as Time,
          value: c.volume,
          color: c.close >= c.open ? "rgba(26,204,155,0.3)" : "rgba(255,74,107,0.3)",
        }));

        series.setData(candleData);
        volSeries.setData(volumeData);
        chartRef.current?.timeScale().fitContent();
      }

      // ── Live price: patch the last candle every frame ────────────────────
      if (history.length > 0 && currentPriceRef.current > 0) {
        const last = history[history.length - 1];
        const livePrice = currentPriceRef.current;

        // BUG FIX: original used `liveFrame` (undefined) — now correctly `livePrice`
        const patchedLow = livePrice < last.low ? livePrice : last.low;
        const patchedHigh = livePrice > last.high ? livePrice : last.high;

        series.update({
          time: last.time as Time,
          open: last.open,
          high: patchedHigh,
          low: patchedLow,
          close: livePrice,
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [candleHistoryRef, currentPriceRef]);

  return (
    <div className="flex-grow flex flex-row min-h-0 relative h-full">
      {/* Toolbar */}
      <div className="w-9 bg-[#0e1114] border-r border-[#171c22] flex flex-col items-center py-2 space-y-3 text-neutral-500 shrink-0">
        <MousePointer size={14} className="text-[#20e6a3]" />
        <Plus size={14} className="hover:text-white cursor-pointer" />
        <Maximize2 size={13} className="hover:text-white cursor-pointer" />
        <div className="flex-grow" />
        <Trash2 size={14} className="hover:text-neutral-300 cursor-pointer" />
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        className="flex-grow h-full min-w-0 bg-[#07090b]"
      />
    </div>
  );
};