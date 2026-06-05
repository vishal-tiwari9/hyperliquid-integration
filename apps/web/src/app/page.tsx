"use client";

import React, { useState, useEffect } from "react";
import { Globe, ArrowRight, Loader2, Wallet, Activity } from "lucide-react";

// 1. EXTEND WINDOW INTERFACE FOR THE SYSTEM COMPILER TO RECOGNIZE GOOGLE IDENTITY OBJECTS
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: any) => void;
        };
      };
    };
  }
}

type OnboardingStage = "GATEWAY" | "VERIFYING_API" | "ONBOARDING_WIZARD" | "TERMINAL";

export default function HomeRouter() {
  const [stage, setStage] = useState<OnboardingStage>("GATEWAY");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [traderWallet, setTraderWallet] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2. HOISTED FUNCTION LIFECYCLE MANAGEMENT: Prevents Temporal Dead Zone Runtime Failures
  async function handleGoogleAuthCallback(responseObj: any) {
    const secureIdToken = responseObj.credential;
    if (!secureIdToken) {
      setErrorMessage("No signed authorization hash received from the verification node.");
      setStage("GATEWAY");
      return;
    }

    setStage("VERIFYING_API");
    setErrorMessage(null);

    try {
      // Dispatch authorization payload directly to our isolated NestJS Microservice Core Router
      const backendSync = await fetch("http://localhost:3001/api/auth/google-handshake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ idToken: secureIdToken }),
      });

      if (!backendSync.ok) {
        if (backendSync.status === 401) {
          throw new Error("Google Handshake validation failed. Cryptographic signature invalid.");
        }
        throw new Error(`Server gateway returned HTTP state code ${backendSync.status}`);
      }

      const sessionPayload = await backendSync.json();
      setCurrentUser(sessionPayload.trader);
      setTraderWallet(sessionPayload.wallet);

      // Branch execution layout states depending on internal user status records
      if (sessionPayload.message === "NEW_USER_WALLET_PROVISIONED") {
        setStage("ONBOARDING_WIZARD");
      } else {
        setStage("TERMINAL");
      }
    } catch (err: any) {
      console.error("Network gateway pipeline processing mismatch:", err);
      setErrorMessage(err.message || "Cannot establish connection link with NestJS Backend Engine on port 3001.");
      setStage("GATEWAY");
    }
  }

  // 3. SECURE BROWSER SCRIPT INJECTION: Initialize Google Identity Engine dynamically
  useEffect(() => {
    if (document.getElementById("google-jssdk")) return;

    const scriptNode = document.createElement("script");
    scriptNode.src = "https://accounts.google.com/gsi/client";
    scriptNode.id = "google-jssdk";
    scriptNode.async = true;
    scriptNode.defer = true;
    scriptNode.onload = () => {
      const targetClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      // Telemetry Debug Check: Guarding against undefined variables
      if (!targetClientId) {
        console.error("❌ CRITICAL ENVIRONMENT FAULT: NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in client-side process contexts!");
        setErrorMessage("System Setup Warning: Client credential identifiers are unconfigured.");
        return;
      }

      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: targetClientId,
          callback: handleGoogleAuthCallback, // Safely reference our hoisted function structure
          auto_select: false,
          cancel_on_tap_outside: true,
        });
      }
    };
    document.head.appendChild(scriptNode);
  }, []);

  // 4. TRIGGER CRYPTOGRAPHIC ACCOUNTS IDENTITY DRAWER PROMPT
  const triggerGoogleLoginPrompt = () => {
    const targetClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!targetClientId) {
      setErrorMessage("Cannot execute handshake. Ensure NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured in your web/.env file.");
      return;
    }

    if (!window.google) {
      setErrorMessage("Identity Provider Service SDK offline. Check network telemetry hooks.");
      return;
    }
    
    setErrorMessage(null);
    window.google.accounts.id.prompt();
  };

  return (
    <div className="relative flex h-screen w-screen flex-col bg-black font-sans antialiased text-[#E5E5E5] overflow-hidden select-none">
      
      {/* COSMIC BACKGROUND DECORATIVE GLOW ACCORDING TO SYSTEM DESIGN GUIDELINES */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-radial from-[#3a2512]/40 via-transparent to-transparent blur-3xl" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-radial from-[#1e1710]/40 via-transparent to-transparent blur-3xl" />
      </div>

      {/* GLOBAL APPLICATION TOP HEADER CONTROLLER */}
      <header className="z-10 flex h-20 w-full items-center justify-between px-6 md:px-12 bg-transparent border-b border-[#0c0c0c]">
        <span className="text-xl tracking-tight text-white font-semibold">
          Mocha<span className="italic font-normal font-serif text-gray-300">trade</span>
        </span>
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-gray-500 uppercase">
          <div className="h-1.5 w-1.5 rounded-full bg-[#E5A93C] animate-pulse" />
          SYSTEM STAGE // {stage}
        </div>
      </header>

      {/* INTERACTIVE ROUTER RENDER HOOK AREA */}
      <main className="z-10 flex flex-1 flex-col items-center justify-center px-4 relative w-full">
        
        {/* STAGE 1: THE INTAKE ENTRANCE LOCK */}
        {stage === "GATEWAY" && (
          <div className="w-full max-w-md text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-5xl text-white font-normal font-serif tracking-tight leading-[1.15]">
                The US market is open. <br />
                <span className="text-[#E5A93C]">Are you?</span>
              </h1>
            </div>

            <div className="border border-[#141414] bg-[#050505]/90 backdrop-blur-md p-8 rounded-xl text-left shadow-2xl relative">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-[#E5A93C] mb-4 font-mono">SECURE ENTRY DESK</h2>
              
              {errorMessage && (
                <div className="mb-4 bg-red-950/30 border border-red-900/50 text-red-400 p-3 rounded text-[11px] font-mono leading-normal">
                  {errorMessage}
                </div>
              )}

              <p className="text-xs text-gray-400 font-mono mb-6 leading-relaxed">
                Connect your verified operational identity node via Google network protocol layer to provision decentralized liquidity pipelines.
              </p>

              <button 
                type="button"
                onClick={triggerGoogleLoginPrompt}
                className="w-full flex items-center justify-center gap-3 border border-[#E5A93C]/40 bg-[#E5A93C]/5 py-4 text-xs font-semibold text-white rounded-lg hover:bg-[#E5A93C] hover:text-black transition-all duration-300 shadow-lg shadow-[#E5A93C]/5"
              >
                <Globe size={15} /> Continue with Google Handshake
              </button>

              <div className="mt-6 pt-4 border-t border-[#111] text-center">
                <span className="text-[10px] font-mono text-gray-600 block">
                  Deep signature checking encrypted via live OAuth authorization tokens
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STAGE 2: BACKEND SIGNATURE MUTATION LOAD INDICATION TIMELINE */}
        {stage === "VERIFYING_API" && (
          <div className="flex flex-col items-center space-y-3 text-center">
            <Loader2 className="animate-spin text-[#E5A93C]" size={28} />
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Validating Authentication Layer Tokens...</span>
          </div>
        )}

        {/* STAGE 3: INTERACTIVE DYNAMIC CRYPTO INITIALIZER WINDOW */}
        {stage === "ONBOARDING_WIZARD" && (
          <div className="w-full max-w-md border border-[#141414] bg-[#050505] p-8 rounded-xl text-center space-y-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#E5A93C]/10 flex items-center justify-center border border-[#E5A93C]/30">
              <Wallet className="text-[#E5A93C]" size={20} />
            </div>
            <h2 className="text-md font-serif text-white tracking-tight">Identity Node Created Successfully!</h2>
            <p className="text-xs text-gray-400 font-mono leading-relaxed">
              Welcome operator, <span className="text-[#E5A93C] font-bold">{currentUser?.name}</span>. Since this is your initial entry execution, we must deploy your inbuilt trading account.
            </p>
            <button 
              onClick={() => setStage("TERMINAL")} 
              className="w-full bg-[#E5A93C] py-3 text-xs font-semibold text-black rounded hover:bg-[#d6962c] transition-all flex items-center justify-center gap-2"
            >
              Initialize Cryptographic Accounts <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* STAGE 4: PRODUCTION TRADING SECURED MATRIX DESK */}
        {stage === "TERMINAL" && (
          <div className="w-full max-w-2xl text-center space-y-6 font-mono animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5a93c]/20 bg-[#e5a93c]/5 px-4 py-1.5 text-[10px] font-bold text-[#E5A93C] uppercase tracking-wider">
              <Activity size={12} className="animate-pulse" /> Live Terminal Pipeline Operational
            </div>
            <h1 className="text-4xl text-white font-normal font-serif tracking-tight leading-none">
              MochaTrade Operational Workspace.
            </h1>
            
            <div className="bg-[#050505] border border-[#141414] p-6 max-w-md mx-auto text-left rounded-xl space-y-3 shadow-xl">
              <div>
                <span className="text-gray-500 text-[10px] block uppercase tracking-wider">OPERATOR PROFILE UUID:</span> 
                <span className="text-white font-bold text-xs">{currentUser?.id}</span>
              </div>
              <div>
                <span className="text-gray-500 text-[10px] block uppercase tracking-wider">ROUTING NODE EMAIL:</span> 
                <span className="text-white text-xs">{currentUser?.email}</span>
              </div>
              <div className="pt-2 border-t border-[#111]">
                <span className="text-[#E5A93C] text-[10px] block uppercase tracking-wider font-bold">DERIVED ETH TRADING WALLET:</span> 
                <span className="text-gray-300 font-bold tracking-tight text-xs break-all block mt-0.5">{traderWallet?.address || "0xNoAddressFound"}</span>
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={() => setStage("GATEWAY")}
                className="text-xs text-gray-500 hover:text-red-400 underline transition-colors"
              >
                Disconnect Session Identity
              </button>
            </div>
          </div>
        )}

      </main>

      {/* COMPLIANCE FOOTER DESK OBJECT */}
      <footer className="z-10 py-6 text-center text-[10px] text-gray-600 tracking-wider bg-transparent border-t border-[#090909]">
        © 2026 MOCHATRADE CORE COMPLIANCE LABS // ALL RIGHTS RESERVED
      </footer>

    </div>
  );
}