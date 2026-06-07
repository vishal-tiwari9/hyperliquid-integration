"use client";

import React, { useEffect, useRef } from "react";
import { MousePointer, Plus, Type, Maximize2, Lock, Eye, Trash2 } from "lucide-react";
import { CandleData } from "@/hooks/useHyperliquidStream";

interface TradingChartProps {
  coin: string;
  currentPriceRef: React.MutableRefObject<number>;
  candleHistoryRef: React.MutableRefObject<CandleData[]>;
}

export const TradingChart: React.FC<TradingChartProps> = ({ coin, currentPriceRef, candleHistoryRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const renderLoop = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) {
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        ctx.scale(dpr, dpr);
      }

      const { width, height } = rect;
      ctx.fillStyle = "#07090b";
      ctx.fillRect(0, 0, width, height);

      const data = candleHistoryRef.current;
      if (data.length === 0) {
        ctx.fillStyle = "#475466";
        ctx.font = "bold 11px monospace";
        ctx.fillText("SYNCHRONIZING SECURE NODE PIPELINE...", width / 2 - 110, height / 2);
        animationFrameId = requestAnimationFrame(renderLoop);
        return;
      }

      // Sync active memory buffer mutations to the trailing candlestick frame index
      const activeFrame = data[data.length - 1];
      const livePrice = currentPriceRef.current || activeFrame.close;
      activeFrame.close = livePrice;
      if (livePrice > activeFrame.high) activeFrame.high = livePrice;
      if (livePrice < activeFrame.low) activeFrame.low = liveFrame;

      const viewport = data.slice(-64);
      let minPrice = Math.min(...viewport.map(c => c.low));
      let maxPrice = Math.max(...viewport.map(c => c.high));
      const maxVol = Math.max(...viewport.map(c => c.volume)) || 1;

      const padding = (maxPrice - minPrice) * 0.1 || 5;
      maxPrice += padding;
      minPrice -= padding;
      const priceRange = maxPrice - minPrice;

      const chartHeight = height * 0.78;
      const volHeight = height * 0.18;

      // Vertical Grid Markings Layout
      ctx.strokeStyle = "#12171c";
      ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) {
        const y = (chartHeight * i) / 6;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width - 65, y); ctx.stroke();
        const priceTick = maxPrice - (i * (priceRange / 6));
        ctx.fillStyle = "#465362";
        ctx.font = "10px monospace";
        ctx.fillText(priceTick.toLocaleString(undefined, { minimumFractionDigits: 1 }), width - 60, y + 3);
      }

      // Drawing Price Action Bars
      const step = (width - 70) / viewport.length;
      viewport.forEach((candle, idx) => {
        const x = idx * step + step / 2;
        const yOpen = chartHeight - ((candle.open - minPrice) / priceRange) * chartHeight;
        const yClose = chartHeight - ((candle.close - minPrice) / priceRange) * chartHeight;
        const yHigh = chartHeight - ((candle.high - minPrice) / priceRange) * chartHeight;
        const yLow = chartHeight - ((candle.low - minPrice) / priceRange) * chartHeight;

        const bull = candle.close >= candle.open;
        const color = bull ? "#1acc9b" : "#ff4a6b";

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(x, yHigh); ctx.lineTo(x, yLow); ctx.stroke();

        ctx.fillStyle = color;
        ctx.fillRect(x - (step * 0.35), Math.min(yOpen, yClose), step * 0.7, Math.max(Math.abs(yOpen - yClose), 2));

        const calculatedVol = (candle.volume / maxVol) * volHeight;
        ctx.fillStyle = bull ? "rgba(26, 204, 155, 0.25)" : "rgba(255, 74, 107, 0.25)";
        ctx.fillRect(x - (step * 0.35), height - calculatedVol, step * 0.7, calculatedVol);
      });

      // Horizontal Interactive Order Execution Level Line Tracker
      const trackerY = chartHeight - ((livePrice - minPrice) / priceRange) * chartHeight;
      if (trackerY >= 0 && trackerY <= chartHeight) {
        ctx.strokeStyle = "#1acc9b";
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(0, trackerY); ctx.lineTo(width - 70, trackerY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#1acc9b"; ctx.fillRect(width - 68, trackerY - 9, 65, 18);
        ctx.fillStyle = "#000000"; ctx.font = "bold 10px monospace";
        ctx.fillText(livePrice.toFixed(1), width - 63, trackerY + 3);
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    animationFrameId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [coin, candleHistoryRef, currentPriceRef]);

  return (
    <div className="flex-grow flex flex-row min-h-0 relative h-full">
      <div className="w-9 bg-[#0e1114] border-r border-[#171c22] flex flex-col items-center py-2 space-y-3 text-neutral-500 shrink-0">
        <MousePointer size={14} className="text-[#20e6a3]" />
        <Plus size={14} className="hover:text-white cursor-pointer" />
        <Type size={14} className="hover:text-white cursor-pointer" />
        <Maximize2 size={13} className="hover:text-white cursor-pointer" />
        <Lock size={13} className="hover:text-white cursor-pointer" />
        <Eye size={14} className="hover:text-white cursor-pointer" />
        <div className="flex-grow" />
        <Trash2 size={14} className="hover:text-neutral-300 cursor-pointer" />
      </div>
      <div ref={containerRef} className="flex-grow h-full bg-black/40 min-w-0">
        <canvas ref={canvasRef} className="block" />
      </div>
    </div>
  );
};