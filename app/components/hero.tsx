"use client"

import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"

interface HeroProps {
  onGetStarted: () => void;
  goToDashboard: () => void;
  isLoading: boolean;
  authenticated: boolean;
}

export function Hero({ 
  onGetStarted, 
  goToDashboard, 
  isLoading, 
  authenticated 
}: HeroProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handlePrimaryClick = () => {
    if (authenticated) {
      goToDashboard();
    } else {
      onGetStarted();
    }
  };

  const buttonText = authenticated 
    ? "Go to Dashboard" 
    : isLoading 
      ? "Opening…" 
      : "Start Trading";

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
        }}
      />
      
      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-slate-950/20" />
      
      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Navigation */}
        <nav className="relative z-50 px-6 py-6">
          <div className="flex items-center justify-between">
            {/* New Logo */}
            <Link href="/" className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="MochaTrade" 
                className="h-10 w-auto" 
              />
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden items-center gap-6 text-sm text-white/70 lg:flex">
              <a href="#features" className="transition-colors hover:text-white">Features</a>
              <a href="#markets" className="transition-colors hover:text-white">Markets</a>
              <a href="#testimonials" className="transition-colors hover:text-white">Testimonials</a>
              <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
              <a href="#faq" className="transition-colors hover:text-white">FAQ</a>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrimaryClick}
                disabled={isLoading}
                className="hidden text-sm font-medium text-white transition-colors hover:text-white/80 lg:block"
              >
                {authenticated ? "Dashboard" : isLoading ? "Opening…" : "Get Started"}
              </button>
              
              {/* Hamburger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white lg:hidden"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="absolute left-0 right-0 top-full bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-700/30 lg:hidden">
              <div className="flex flex-col px-6 py-6 gap-4">
                <a href="#features" className="text-white/70 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#markets" className="text-white/70 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Markets</a>
                <a href="#testimonials" className="text-white/70 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
                <a href="#pricing" className="text-white/70 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <a href="#faq" className="text-white/70 hover:text-white py-2" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
                
                <button
                  onClick={() => {
                    handlePrimaryClick();
                    setMobileMenuOpen(false);
                  }}
                  disabled={isLoading}
                  className="mt-2 text-white font-medium py-2 border-t border-zinc-700/30 text-left"
                >
                  {buttonText}
                </button>
              </div>
            </div>
          )}
        </nav>

        {/* Hero Content */}
        <div className="flex flex-1 flex-col items-center px-6 pt-16 text-center md:pt-24">
          <h1 className="max-w-3xl text-balance text-5xl font-normal tracking-tight text-white md:text-6xl lg:text-7xl">
            {"Leveraged US Stock trading.Unlocked for the globe.".split(" ").map((word, i) => (
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
          </h1>
          
          <p className="mt-6 max-w-xl text-balance text-center text-sm leading-relaxed text-white/70 md:text-base">
            Instant INR → USDC via UPI. Up to 50× leverage on BTC, ETH, SOL & more. Zero custody. Powered by Hyperliquid.
          </p>

          {/* Main CTA Buttons */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Button
  size="lg"
  onClick={handlePrimaryClick}
  disabled={isLoading}
  className="bg-white text-slate-900 border border-black/10 hover:bg-zinc-100 rounded-full px-8 py-6"
>
  {buttonText}
</Button>
          
          </div>
        </div>
      </div>
    </section>
  )
}