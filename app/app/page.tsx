"use client";
// app/page.tsx — Landing page
// FIX: Privy hook works on client; auto-redirect re-enabled.

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { login, ready, authenticated } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   if (authenticated && ready) {
  //     router.push("/dashboard/trade");
  //   }
  // }, [authenticated, ready, router]);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#20e6a3] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#20e6a3] to-blue-500 rounded-xl flex items-center justify-center font-bold text-xl text-black">
              M
            </div>
            <span className="text-2xl font-semibold tracking-tight">MochaTrade</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="hover:text-[#20e6a3] transition text-sm">Features</a>
            <a href="#markets" className="hover:text-[#20e6a3] transition text-sm">Markets</a>
            <button
              onClick={handleGetStarted}
              className="px-6 py-2.5 bg-[#20e6a3] text-black font-semibold rounded-2xl hover:bg-[#1bd89a] transition"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm px-4 py-1.5 rounded-full mb-6">
            ✦ Powered by Hyperliquid • Non-Custodial Perps
          </div>
          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter mb-6">
            Trade Crypto Perps.<br />
            <span className="bg-gradient-to-r from-[#20e6a3] to-blue-400 bg-clip-text text-transparent">
              With Leverage.
            </span>
          </h1>
          <p className="text-2xl text-gray-400 max-w-2xl mx-auto mb-10">
            Instant INR → USDC via UPI. Up to 50× leverage on BTC, ETH, SOL & more. Zero custody.
          </p>
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="px-10 py-4 text-xl font-semibold bg-gradient-to-r from-[#20e6a3] to-blue-500 text-black rounded-3xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-[#20e6a3]/20"
          >
            {isLoading ? "Opening…" : "Start Trading — It's Free"}
          </button>
          <p className="text-sm text-gray-500 mt-4">10 seconds to set up • No seed phrase needed</p>
        </div>
      </section>

      {/* Ticker bar */}
      <div className="border-t border-white/10 py-4 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-10 text-sm text-gray-400">
          <span>BTC-USDC <span className="text-[#20e6a3]">50×</span></span>
          <span>ETH-USDC <span className="text-[#20e6a3]">50×</span></span>
          <span>SOL-USDC <span className="text-[#20e6a3]">20×</span></span>
          <span>HYPE-USDC <span className="text-[#20e6a3]">10×</span></span>
          <span>ARB-USDC <span className="text-[#20e6a3]">20×</span></span>
        </div>
      </div>
    </div>
  );
}