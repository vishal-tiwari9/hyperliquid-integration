"use client";
// app/page.tsx — Full MochaTrade Landing Page

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion"; // Ensure framer-motion is installed

import { Hero } from "@/components/hero";
import { LogoSection } from "@/components/logo-section";
import { ProblemSection } from "@/components/problem-section";
import { SolutionSection } from "@/components/solution-section";
import { FeaturesSection } from "@/components/features-section";
import { FaqSection } from "@/components/faq-section";
import { CtaSection } from "@/components/cta-section";
import { Footer } from "@/components/footer";

// Extracted Loader Component for clean architecture
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

  const goToDashboard = () => {
    router.push("/dashboard/trade");
  };

  if (!ready) {
    return <MochaLoader />;
  }

  return (
    <>
      {/* Vertical margin lines */}
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
          onGetStarted={handleGetStarted}
          goToDashboard={goToDashboard}
          isLoading={isLoading}
          authenticated={authenticated}
        />

        <LogoSection />
        <ProblemSection />
        <SolutionSection />
        <FeaturesSection />
      
        <FaqSection />
        
        <CtaSection 
          onGetStarted={handleGetStarted}
          goToDashboard={goToDashboard}
          isLoading={isLoading}
          authenticated={authenticated}
        />
      </main>

      <Footer />
    </>
  );
}