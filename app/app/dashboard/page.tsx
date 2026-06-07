"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect } from "react";
import { syncPrivyUser, updateLoginStreak } from "../actions";

export default function Dashboard() {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();

  useEffect(() => {
    if (authenticated && user) {
      syncPrivyUser(user);
      if (wallets.length > 0) {
        // You can also sync wallet address here
      }
      updateLoginStreak(user.id);
    }
  }, [authenticated, user, wallets]);

  return (
    <div>
      <h2 className="text-4xl font-bold mb-8">Welcome back, {user?.google?.name || "Trader"}!</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 rounded-3xl p-8">
          <p className="text-gray-400">USDC Balance</p>
          <p className="text-5xl font-bold mt-3">$0.00</p>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-8">
          <p className="text-gray-400">Current Streak</p>
          <p className="text-5xl font-bold mt-3 text-orange-400">7 🔥</p>
        </div>

        <div className="bg-zinc-900 rounded-3xl p-8">
          <p className="text-gray-400">Open Positions</p>
          <p className="text-5xl font-bold mt-3">0</p>
        </div>
      </div>

      {/* Market Cards Section - Add later */}
    </div>
  );
}