"use client";

import { motion } from "framer-motion";

export function ProblemSection() {




  return (
    <section className="relative w-full bg-zinc-900 py-24 md:py-32 border-b border-zinc-700/30">
      {/* Grain texture overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: "url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 result=%22noise%22 /></filter><rect width=%22100%22 height=%22100%22 filter=%22url(%23noise)%22 fill=%22%23ffffff%22/></svg>'\")",
      }} />
      
     

<div className="space-y-8 text-center flex flex-col items-center">
  <div className="flex items-center gap-3 px-4 py-2 border border-zinc-700 w-fit">
    <div className="w-2.5 h-2.5 bg-[#20e6a3]" /> {/* Brand color */}
    <span className="text-sm font-medium text-zinc-400 tracking-wide">
      The Market Inefficiency
    </span>
  </div>

    <h2 className="text-balance text-5xl font-normal tracking-tight text-white md:text-6xl lg:text-5xl">
            {"The Perimeter Has Dissolved".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ filter: "blur(10px)", opacity: 0 }}
                whileInView={{ filter: "blur(0px)", opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
          </h2>

  <p className="text-balance text-lg leading-relaxed text-gray-300 md:text-xl">
    Traditional perpetual exchanges are built on fragmented liquidity pools. 
    Traders are trapped by high slippage, opaque execution, and latency that 
    destroys alpha. You don’t need another interface; you need an engine that 
    unifies decentralized liquidity and executes like CeFi.
  </p>

  <div className="flex flex-col gap-4 pt-8 sm:flex-row sm:justify-center">
    <button className="bg-[#20e6a3] px-8 py-3 font-semibold text-black transition-all hover:bg-[#1bcba0] active:scale-95"
      onClick={() => {
        window.location.href = "/dashboard/trade";
      }}  
    >
      Start Trading Now
    </button>
    <button className="border border-white/30 px-8 py-3 font-semibold text-white transition-all hover:bg-white/10 active:scale-95">
      Read The Whitepaper
    </button>
  </div>
</div>
    </section>
  );
}
