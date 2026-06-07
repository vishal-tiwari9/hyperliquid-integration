"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, IChartApi } from "lightweight-charts";

export default function TradingChart({ coin }: { coin: string }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: { background: { color: '#0A0A0A' }, textColor: '#D1D5DB' },
      grid: { vertLines: { color: '#1F2937' }, horzLines: { color: '#1F2937' } },
      timeScale: { timeVisible: true, secondsVisible: true },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22C55E',
      downColor: '#EF4444',
      borderVisible: false,
    });

    chartRef.current = chart;

    // TODO: Connect to WS proxy for live candles
    // For now, mock data
    candleSeries.setData([
      // Add sample candles here or fetch real data
    ]);

    const handleResize = () => chart.resize(chartContainerRef.current!.clientWidth, 600);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [coin]);

  return (
    <div className="flex-1 relative bg-[#0A0A0A]" ref={chartContainerRef} />
  );
}