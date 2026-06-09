"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import {
  Wallet, Shield, Zap, ArrowRight, Copy, Check,
  Download, ChevronRight, ExternalLink,
} from "lucide-react";

// --- Components ---

const FullLoader = () => (
  <div className="min-h-screen bg-[#07090b] flex flex-col items-center justify-center gap-4">
    <div className="w-10 h-10 border-2 border-[#20e6a3] border-t-transparent rounded-full animate-spin" />
    <p className="text-[#566273] text-sm animate-pulse">Initializing Security...</p>
  </div>
);

// --- Main Page ---

export default function OnboardingPage() {
  const { login, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Access the Privy embedded wallet instance
  const embedded = wallets.find((w) => w.walletClientType === "privy");
  const address = embedded?.address ?? "";

  // Auto-redirect if already onboarded
  useEffect(() => {
    if (!ready) return;
    if (localStorage.getItem("mocha_onboarded") === "1" && authenticated) {
      router.replace("/dashboard/trade");
    }
  }, [ready, authenticated, router]);

  // Auto-advance once wallet is ready
  useEffect(() => {
    if (step === 1 && authenticated && address) {
      setTimeout(() => setStep(2), 1000);
    }
  }, [step, authenticated, address]);

  const copyAddr = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExport = async () => {
    if (!embedded) return;
    setExporting(true);
    try {
      await embedded.exportWallet();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const finish = () => {
    localStorage.setItem("mocha_onboarded", "1");
    router.push("/dashboard/trade");
  };

  if (!ready) return <FullLoader />;

  return (
    <div className="min-h-screen bg-[#07090b] text-white flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#20e6a3]/10 via-transparent to-transparent" />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#171c22]">
        <div className="h-full bg-gradient-to-r from-[#20e6a3] to-[#0ea5e9] transition-all duration-500"
          style={{ width: `${(step / 4) * 100}%` }} />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 z-10">
        <div className="w-10 h-10 bg-gradient-to-br from-[#20e6a3] to-[#0ea5e9] rounded-xl flex items-center justify-center text-black font-black text-lg">M</div>
        <span className="font-bold text-xl tracking-tight">MochaTrade</span>
      </div>

      {/* Container */}
      <div className="w-full max-w-md bg-[#0e1114]/80 backdrop-blur-xl border border-[#262f3a] rounded-3xl p-8 shadow-2xl relative">
        {step === 0 && <StepWelcome onNext={() => setStep(1)} onLogin={login} authenticated={authenticated} />}
        {step === 1 && <StepCreateWallet authenticated={authenticated} address={address} onLogin={login} />}
        {step === 2 && <StepBackup address={address} copied={copied} onCopy={copyAddr} onExport={handleExport} exporting={exporting} onNext={() => setStep(3)} />}
        {step === 3 && <StepFund address={address} onNext={() => setStep(4)} />}
        {step === 4 && <StepReady onFinish={finish} />}
      </div>
    </div>
  );
}

// --- Steps ---

function StepWelcome({ onNext, onLogin, authenticated }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-[#20e6a3]/20 to-[#0ea5e9]/20 rounded-2xl flex items-center justify-center border border-[#20e6a3]/20 mx-auto">
        <Zap size={36} className="text-[#20e6a3]" />
      </div>
      <div>
        <h1 className="text-white font-black text-2xl mb-2">Welcome to MochaTrade</h1>
        <p className="text-[#566273] text-sm">Trade with 50x leverage. No seed phrases, just instant access.</p>
      </div>
      <button onClick={authenticated ? onNext : onLogin}
        className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase rounded-xl hover:bg-[#1bd89a] transition-all flex items-center justify-center gap-2">
        {authenticated ? "Continue" : "Get Started"} <ArrowRight size={16} />
      </button>
    </div>
  );
}

function StepCreateWallet({ authenticated, address, onLogin }: any) {
  return (
    <div className="text-center space-y-6">
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border mx-auto ${address ? "bg-[#20e6a3]/20 border-[#20e6a3]/40" : "bg-[#12161a] border-[#262f3a]"}`}>
        {address ? <Check size={36} className="text-[#20e6a3]" /> : <Wallet size={36} className="text-[#566273] animate-pulse" />}
      </div>
      <h2 className="text-white font-black text-xl">{address ? "Wallet Created!" : "Creating Wallet…"}</h2>
      {!authenticated && <button onClick={onLogin} className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm rounded-xl hover:bg-[#1bd89a]">Sign In</button>}
      {address && <div className="bg-[#12161a] p-3 rounded-xl border border-[#20e6a3]/20 font-mono text-xs text-[#20e6a3] break-all">{address}</div>}
    </div>
  );
}

function StepBackup({ address, copied, onCopy, onExport, exporting, onNext }: any) {
  return (
    <div className="space-y-5">
      <h2 className="text-white font-black text-xl text-center">Secure Your Wallet</h2>
      <div className="bg-[#12161a] rounded-xl p-3 border border-[#262f3a] flex items-center justify-between">
        <span className="text-[#20e6a3] font-mono text-xs truncate mr-2">{address}</span>
        <button onClick={onCopy} className="p-2 bg-[#262f3a] rounded-lg">{copied ? <Check size={14} className="text-[#20e6a3]" /> : <Copy size={14} />}</button>
      </div>
      <button onClick={onExport} disabled={exporting} className="w-full py-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-sm rounded-xl">
        {exporting ? "Exporting..." : "Export Private Key"}
      </button>
      <button onClick={onNext} className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase rounded-xl">Continue</button>
    </div>
  );
}

function StepFund({ address, onNext }: any) {
  return (
    <div className="space-y-5">
      <h2 className="text-white font-black text-xl text-center">Fund Account</h2>
      <div className="bg-[#12161a] rounded-xl p-4 border border-[#262f3a]">
        <p className="text-white font-bold text-sm">🧪 Get Testnet USDC</p>
        <a href="https://app.hyperliquid-testnet.xyz/drip" target="_blank" rel="noopener noreferrer" className="mt-3 block w-full py-2 text-center bg-[#20e6a3]/10 border border-[#20e6a3]/20 text-[#20e6a3] text-xs font-bold rounded-lg">
          Open Faucet <ExternalLink className="inline ml-1" size={11} />
        </a>
      </div>
      <button onClick={onNext} className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase rounded-xl">Continue</button>
    </div>
  );
}

function StepReady({ onFinish }: any) {
  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 bg-gradient-to-br from-[#20e6a3]/20 to-[#0ea5e9]/20 rounded-full flex items-center justify-center border border-[#20e6a3]/30 mx-auto text-5xl">🚀</div>
      <h2 className="text-white font-black text-2xl">You're All Set!</h2>
      <button onClick={onFinish} className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase rounded-xl">Start Trading <ChevronRight size={16} /></button>
    </div>
  );
}