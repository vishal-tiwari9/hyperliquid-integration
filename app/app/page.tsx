"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const { login, ready, authenticated } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Auto-redirect logged-in users
  // useEffect(() => {
  //   if (authenticated && ready) {
  //     router.push("/dashboard");
  //   }
  // }, [authenticated, ready, router]);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      await login(); // Opens Privy modal (Google first)
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-xl">
              M
            </div>
            <span className="text-2xl font-semibold tracking-tight">Mochtrade</span>
          </div>

          <div className="flex items-center gap-8">
            <a href="#features" className="hover:text-blue-400 transition">Features</a>
            <a href="#markets" className="hover:text-blue-400 transition">Markets</a>
            <button
              onClick={authenticated ? () => router.push("/dashboard") : handleGetStarted}
              className="px-6 py-2.5 bg-white text-black font-semibold rounded-2xl hover:bg-white/90 transition"
            >
              {authenticated ? "Go to Dashboard" : "Get Started"}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm px-4 py-1.5 rounded-full mb-6">
            Powered by Hyperliquid • USDC Perps
          </div>

          <h1 className="text-7xl md:text-8xl font-bold tracking-tighter mb-6">
            Trade US Stocks.<br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              With Leverage.
            </span>
          </h1>

          <p className="text-2xl text-gray-400 max-w-2xl mx-auto mb-10">
            Instant INR → USDC via UPI. Real US stock perps. Zero custody hassle.
          </p>

          <button
            onClick={authenticated ? () => router.push("/dashboard/trade") : handleGetStarted}
            disabled={isLoading}
            className="px-10 py-4 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-blue-500/30"
          >
            {isLoading ? "Opening..." : authenticated ? "Open Trading Dashboard" : "Get Started — It's Free"}
          </button>

          <p className="text-sm text-gray-500 mt-4">Takes 10 seconds • No seed phrase</p>
        </div>
      </section>

      {/* Trust bar / Live markets etc. — Add more sections as needed */}
      <div className="border-t border-white/10 py-6 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-12 text-sm opacity-70">
          <div>TSLA • +2.4%</div>
          <div>NVDA • -1.1%</div>
          <div>AAPL • +0.8%</div>
          <div>BTC • +3.2%</div>
        </div>
      </div>
    </div>
  );
}