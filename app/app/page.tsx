"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import { Hero } from "@/components/hero";
import { LogoSection } from "@/components/logo-section";
import { ProblemSection } from "@/components/problem-section";
import { SolutionSection } from "@/components/solution-section";
import { FeaturesSection } from "@/components/features-section";
import { FaqSection } from "@/components/faq-section";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

const MochaLoader = () => {

  const barHeights = ["h-3", "h-5", "h-7"];



  return (

    <div className="min-h-screen bg-grey-300 flex flex-col items-center justify-center gap-8">

      <div className="relative flex flex-col items-center gap-2">

       

        {/* Steam Bars */}

        <div className="flex items-end gap-1.5 h-8">

          {barHeights.map((h, i) => (

            <motion.div

              key={i}

              className={`w-1 bg-[#ffffff] rounded-full ${h}`}

              // We keep the logic simple, but the 'times' control the pace

              animate={{

                scaleY: [0, 1, 1, 0],

                opacity: [0, 1, 1, 0],

                y: [0, -10, -10, 0]

              }}

              transition={{

                duration: 3, // Total cycle is 3 seconds

                repeat: Infinity,

                delay: i * 0.2,

                // [Start, Full-Size, Hold, Reset]

                times: [0, 0.3, 0.7, 1],

                ease: "easeInOut",

              }}

            />

          ))}

        </div>



        {/* The Cup */}

        <div className="relative w-12 h-6 border-2 border-[#ffffff] rounded-b-full overflow-hidden">

          <motion.div

            className="absolute bottom-0 left-0 right-0 bg-[#ffffff]"

            animate={{ height: ["0%", "100%", "100%", "0%"] }}

            transition={{

              duration: 3,

              repeat: Infinity,

              times: [0, 0.3, 0.7, 1],

              ease: "easeInOut",

            }}

          />

        </div>

      </div>



      <motion.div

        animate={{ opacity: [0.5, 1, 0.5] }}

        transition={{ duration: 2, repeat: Infinity }}

        className="text-white text-2xl font-light tracking-wide"

      >

        Mocha<span className="italic font-serif">trade</span>

      </motion.div>

    </div>

  );

};

export default function Home() {
  const { login, ready, authenticated } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Redirection logic for authenticated users
  useEffect(() => {
    if (ready && authenticated) {
      const onboarded = localStorage.getItem("mocha_onboarded");
      router.replace(onboarded === "1" ? "/dashboard/trade" : "/onboarding");
    }
  }, [ready, authenticated, router]);

  const handleStartTrading = async () => {
    setIsLoading(true);
    const onboarded = localStorage.getItem("mocha_onboarded");
    
    if (authenticated) {
      router.push(onboarded === "1" ? "/dashboard/trade" : "/onboarding");
    } else {
      try {
        await login();
      } catch (error) {
        console.error("Login failed", error);
        setIsLoading(false);
      }
    }
  };

  if (!ready) return <MochaLoader />;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-50">
        <div className="mx-auto h-full max-w-7xl">
          <div className="relative h-full">
            <div className="absolute left-0 top-0 h-full w-px bg-zinc-700/30" />
            <div className="absolute right-0 top-0 h-full w-px bg-zinc-700/30" />
          </div>
        </div>
      </div>

      <main className="bg-black text-white overflow-hidden">
        <Hero 
          onGetStarted={handleStartTrading}
          goToDashboard={() => router.push("/dashboard/trade")}
          isLoading={isLoading}
          authenticated={authenticated}
        />

        <LogoSection />

        {/* Integrated Features Grid from Page 2 */}
        <section id="features" className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { emoji:"🔐", title:"Non-Custodial", desc:"Your keys, your assets. Privy embedded wallet — no seed phrase." },
            { emoji:"🇮🇳", title:"UPI On-Ramp", desc:"Deposit INR via UPI. Instant conversion to USDC." },
            { emoji:"📊", title:"Pro Charts", desc:"TradingView charts with drawing tools, 100+ indicators." },
          ].map((f) => (
            <div key={f.title} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
              <div className="text-4xl mb-4">{f.emoji}</div>
              <h3 className="text-xl font-medium mb-2">{f.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        <ProblemSection />
        <SolutionSection />
        
        {/* Markets Grid Integrated */}
        <section id="markets" className="py-24 px-6 max-w-7xl mx-auto">
            <h2 className="text-3xl font-normal text-white mb-12">30+ Available Markets</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {['BTC', 'ETH', 'SOL', 'HYPE', 'TSLA', 'NVDA', 'AAPL', 'MSFT', 'ARB', 'AVAX'].map(m => (
                    <div key={m} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors cursor-pointer">
                        <div className="text-white font-medium">{m}</div>
                        <div className="text-xs text-zinc-500">PERP</div>
                    </div>
                ))}
            </div>
        </section>

        <FeaturesSection />
        <FaqSection />
        
        <CtaSection 
          onGetStarted={handleStartTrading}
          goToDashboard={() => router.push("/dashboard/trade")}
          isLoading={isLoading}
          authenticated={authenticated}
        />
      </main>

      <Footer />
    </>
  );
}