"use client";

export default function RecentTrades({ coin }: { coin: string }) {
  return (
    <div className="h-full p-4">
      <div className="font-semibold mb-3">Recent Trades</div>
      <div className="text-xs font-mono space-y-1 overflow-auto h-full">
        {/* Populate from WS */}
        <div className="flex justify-between text-emerald-400">
          <span>62,245.2</span>
          <span>0.124 BTC</span>
          <span>12:34:21</span>
        </div>
      </div>
    </div>
  );
}