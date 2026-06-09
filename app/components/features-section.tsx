"use client";

import React from "react";
import { motion } from "framer-motion";
import { BarChart3, ShieldCheck, Zap, Layers, Wallet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Update icons and descriptions for a Perpetual DEX context
const MOCHA_FEATURES = [
  {
    id: "1",
    icon: <Zap className="w-5 h-5 text-black" />,
    title: "Zero-Latency Execution",
    description: "Built for speed. Our matching engine ensures your orders hit the book in milliseconds, outperforming legacy platforms.",
  },
  {
    id: "2",
    icon: <ShieldCheck className="w-5 h-5 text-black" />,
    title: "Non-Custodial Security",
    description: "You hold the keys, we provide the engine. Trade with full peace of mind using our audited, trustless smart contracts.",
  },
  {
    id: "3",
    icon: <Layers className="w-5 h-5 text-black" />,
    title: "Deep Liquidity Aggregation",
    description: "We unify fragmented liquidity pools to ensure minimal slippage and tighter spreads on every single position.",
  },
  {
    id: "4",
    icon: <BarChart3 className="w-5 h-5 text-black" />,
    title: "Institutional Alpha Tools",
    description: "Access advanced charting, custom alerts, and professional-grade order types built for the serious trader.",
  },
  {
    id: "5",
    icon: <Wallet className="w-5 h-5 text-black" />,
    title: "One-Click Onboarding",
    description: "Designed for the Indian market. Connect your wallet and start trading in seconds, without complex configurations.",
  },
  {
    id: "6",
    icon: <Globe className="w-5 h-5 text-black" />,
    title: "Global Market Access",
    description: "Unlock international perpetual markets with local efficiency, bypassing traditional barriers to entry.",
  },
];

export function FeaturesSection({
  preHeading = "Trading Infrastructure",
  headline = "The Perpetual Engine Built for Performance",
  features = MOCHA_FEATURES,
  className,
}: {
  preHeading?: string;
  headline?: string;
  features?: typeof MOCHA_FEATURES;
  className?: string;
}) {
  return (
    <section className={cn("w-full bg-black py-24 border-b border-zinc-800", className)}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        {/* Header - No changes to structure */}
        <motion.div initial={{ opacity: 0, y: -20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="flex flex-col gap-6 mb-16">
          <div className="flex items-center gap-3 px-4 py-2 border border-zinc-700 w-fit">
            <div className="w-2.5 h-2.5 bg-[#20e6a3]" />
            <span className="text-sm font-medium text-zinc-400 tracking-wide">{preHeading}</span>
          </div>
          <h2 className="text-balance text-white text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.1] max-w-[700px] tracking-tight">
            {headline.split(" ").map((word, i) => (
              <motion.span key={i} initial={{ filter: "blur(10px)", opacity: 0 }} whileInView={{ filter: "blur(0px)", opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }} className="inline-block mr-[0.25em]">
                {word}
              </motion.span>
            ))}
          </h2>
        </motion.div>

        {/* Features Grid - Updated Icon Colors */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 mb-16">
          {features.map((feature) => (
            <motion.div key={feature.id} className="flex flex-col group">
              <div className="mb-8">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#20e6a3] shadow-lg shadow-[#20e6a3]/20 transition-transform group-hover:scale-110 duration-300">
                  {feature.icon}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="text-white text-xl font-medium tracking-tight">{feature.title}</h4>
                <p className="text-balance text-zinc-400 text-base leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-[#20e6a3] text-black hover:bg-[#1bcba0] px-8"  onClick={() => {
              window.location.href = "/dashboard/trade";
            }} >Start Trading Now</Button>
          <Button size="lg" variant="outline" className="border-zinc-700 text-white hover:bg-zinc-900 bg-transparent px-8">View Market Pairs</Button>
        </div>
      </div>
    </section>
  );
}