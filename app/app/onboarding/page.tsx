"use client";
// Onboarding page – multi-step first-run experience
// Steps: Welcome → Create Wallet → Backup → Fund → Done

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import {
  Wallet, Shield, Zap, ArrowRight, Copy, Check,
  Eye, EyeOff, ExternalLink, Download, ChevronRight,
} from "lucide-react";

const STEPS = [
  { id: "welcome",  label: "Welcome"  },
  { id: "wallet",   label: "Wallet"   },
  { id: "backup",   label: "Backup"   },
  { id: "fund",     label: "Fund"     },
  { id: "ready",    label: "Trade!"   },
];

export default function OnboardingPage() {
  const { login, authenticated, ready, user } = usePrivy();
  const { wallets, exportWallet } = useWallets();
  const router = useRouter();

  const [step,       setStep]     = useState(0);
  const [copied,     setCopied]   = useState(false);
  const [showPK,     setShowPK]   = useState(false);
  const [exporting,  setExporting] = useState(false);

  const embedded = wallets.find(w => w.walletClientType === "privy");
  const address  = embedded?.address ?? "";

  // Skip if already onboarded
  useEffect(() => {
    if (!ready) return;
    const done = localStorage.getItem("mocha_onboarded");
    if (done === "1" && authenticated) router.replace("/dashboard/trade");
  }, [ready, authenticated]);

  // Advance automatically after wallet is created
  useEffect(() => {
    if (step === 1 && authenticated && address) {
      setTimeout(() => setStep(2), 800);
    }
  }, [step, authenticated, address]);

  const copyAddr = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportWallet(); } finally { setExporting(false); }
  };

  const finish = () => {
    localStorage.setItem("mocha_onboarded", "1");
    router.push("/dashboard/trade");
  };

  if (!ready) return <FullLoader />;

  return (
    <div className="min-h-screen bg-[#07090b] flex flex-col items-center justify-center p-4">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#20e6a3]/5 rounded-full blur-[120px]" />
      </div>

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-[#171c22] z-50">
        <div className="h-full bg-[#20e6a3] transition-all duration-500"
          style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
      </div>

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10 mt-6">
        <div className="w-9 h-9 bg-gradient-to-br from-[#20e6a3] to-[#0ea5e9] rounded-xl flex items-center justify-center text-black font-black text-lg">M</div>
        <span className="text-white font-bold text-xl tracking-tight">MochaTrade</span>
      </div>

      {/* Step card */}
      <div className="w-full max-w-md bg-[#0e1114] border border-[#262f3a] rounded-2xl overflow-hidden shadow-2xl slide-up">

        {/* Step indicators */}
        <div className="flex px-6 pt-5 gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-1">
              <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                i <= step ? "bg-[#20e6a3]" : "bg-[#262f3a]"
              }`} />
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 pt-4">
          {step === 0 && <StepWelcome onNext={() => setStep(1)} onLogin={login} authenticated={authenticated} />}
          {step === 1 && <StepCreateWallet authenticated={authenticated} address={address} onLogin={login} />}
          {step === 2 && (
            <StepBackup
              address={address}
              copied={copied}
              onCopy={copyAddr}
              onExport={handleExport}
              exporting={exporting}
              onNext={() => setStep(3)}
            />
          )}
          {step === 3 && <StepFund address={address} onNext={() => setStep(4)} />}
          {step === 4 && <StepReady onFinish={finish} />}
        </div>
      </div>

      {/* Skip link (not for first step) */}
      {step > 0 && step < 4 && (
        <button onClick={finish}
          className="mt-5 text-[#566273] text-xs hover:text-white transition-colors">
          Skip for now →
        </button>
      )}
    </div>
  );
}

// ── Step 0: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ onNext, onLogin, authenticated }: {
  onNext: () => void; onLogin: () => void; authenticated: boolean;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-gradient-to-br from-[#20e6a3]/20 to-[#0ea5e9]/20 rounded-2xl flex items-center justify-center border border-[#20e6a3]/20">
          <Zap size={36} className="text-[#20e6a3]" />
        </div>
      </div>
      <div>
        <h1 className="text-white font-black text-2xl mb-2">Welcome to MochaTrade</h1>
        <p className="text-[#566273] text-sm leading-relaxed">
          Trade crypto &amp; stock perpetuals with up to 50× leverage.
          <br />Non-custodial. INR deposits via UPI.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: "🔐", title: "Non-custodial", desc: "You own your keys" },
          { icon: "⚡", title: "Instant", desc: "10s wallet setup" },
          { icon: "🇮🇳", title: "INR Ready", desc: "UPI on-ramp" },
        ].map(f => (
          <div key={f.title} className="bg-[#12161a] rounded-xl p-3 border border-[#262f3a]">
            <div className="text-2xl mb-1">{f.icon}</div>
            <div className="text-white font-bold text-[11px]">{f.title}</div>
            <div className="text-[#566273] text-[10px]">{f.desc}</div>
          </div>
        ))}
      </div>
      <button
        onClick={authenticated ? onNext : onLogin}
        className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#1bd89a] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        {authenticated ? "Continue" : "Get Started"} <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ── Step 1: Create Wallet ────────────────────────────────────────────────────
function StepCreateWallet({ authenticated, address, onLogin }: {
  authenticated: boolean; address: string; onLogin: () => void;
}) {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-700 ${
          address
            ? "bg-[#20e6a3]/20 border-[#20e6a3]/40"
            : "bg-[#12161a] border-[#262f3a]"
        }`}>
          {address
            ? <Check size={36} className="text-[#20e6a3]" />
            : <Wallet size={36} className="text-[#566273] animate-pulse" />}
        </div>
      </div>
      <div>
        <h2 className="text-white font-black text-xl mb-2">
          {address ? "Wallet Created!" : "Creating your wallet…"}
        </h2>
        <p className="text-[#566273] text-sm">
          {address
            ? "Your non-custodial Ethereum wallet is ready."
            : "Sign in and we'll auto-generate a wallet for you."}
        </p>
      </div>
      {!authenticated && (
        <button onClick={onLogin}
          className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#1bd89a] transition-colors flex items-center justify-center gap-2">
          <Wallet size={16} /> Sign In to Create Wallet
        </button>
      )}
      {authenticated && !address && (
        <div className="flex items-center justify-center gap-2 text-[#566273] text-sm">
          <div className="w-4 h-4 border-2 border-[#20e6a3] border-t-transparent rounded-full animate-spin" />
          Setting up wallet…
        </div>
      )}
      {address && (
        <div className="bg-[#12161a] rounded-xl p-3 border border-[#20e6a3]/20 text-left">
          <p className="text-[10px] text-[#566273] mb-1">Your wallet address</p>
          <p className="text-[#20e6a3] font-mono text-[12px] break-all">{address}</p>
        </div>
      )}
    </div>
  );
}

// ── Step 2: Backup wallet ────────────────────────────────────────────────────
function StepBackup({ address, copied, onCopy, onExport, exporting, onNext }: {
  address: string; copied: boolean; onCopy: () => void;
  onExport: () => void; exporting: boolean; onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
          <Shield size={28} className="text-blue-400" />
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-white font-black text-xl mb-1">Secure Your Wallet</h2>
        <p className="text-[#566273] text-sm">Save your address and optionally export your private key.</p>
      </div>

      {/* Address copy */}
      <div className="bg-[#12161a] rounded-xl p-3 border border-[#262f3a]">
        <p className="text-[10px] text-[#566273] mb-1.5 font-bold uppercase">Wallet Address</p>
        <div className="flex items-center gap-2">
          <p className="text-white font-mono text-[11px] flex-1 break-all">{address}</p>
          <button onClick={onCopy}
            className="shrink-0 p-1.5 bg-[#262f3a] rounded-lg hover:bg-[#3a4554] transition-colors">
            {copied ? <Check size={14} className="text-[#20e6a3]" /> : <Copy size={14} className="text-[#566273]" />}
          </button>
        </div>
      </div>

      {/* Export private key */}
      <div className="bg-[#12161a] rounded-xl p-4 border border-yellow-500/20 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center shrink-0">
            <Download size={14} className="text-yellow-400" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Export Private Key</p>
            <p className="text-[#566273] text-[11px] mt-0.5 leading-relaxed">
              Export to MetaMask, Ledger, or any Ethereum wallet. Store it offline safely.
            </p>
          </div>
        </div>
        <button onClick={onExport} disabled={exporting}
          className="w-full py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-bold text-xs rounded-lg hover:bg-yellow-500/20 transition-colors flex items-center justify-center gap-1.5">
          {exporting ? (
            <><div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" /> Exporting…</>
          ) : (
            <><Download size={12} /> Export Private Key</>
          )}
        </button>
        <p className="text-yellow-600 text-[10px] text-center">⚠ Never share your private key with anyone</p>
      </div>

      <button onClick={onNext}
        className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#1bd89a] transition-colors flex items-center justify-center gap-2">
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ── Step 3: Fund account ─────────────────────────────────────────────────────
function StepFund({ address, onNext }: { address: string; onNext: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="w-16 h-16 bg-[#20e6a3]/10 rounded-2xl flex items-center justify-center border border-[#20e6a3]/20 mx-auto mb-4">
          <span className="text-3xl">₹</span>
        </div>
        <h2 className="text-white font-black text-xl mb-1">Fund Your Account</h2>
        <p className="text-[#566273] text-sm">Deposit USDC to start trading. UPI deposits coming soon!</p>
      </div>

      <div className="space-y-3">
        {/* Testnet faucet */}
        <div className="bg-[#12161a] rounded-xl p-4 border border-[#262f3a]">
          <p className="text-white font-bold text-sm mb-1">🧪 Testnet — Get Free USDC</p>
          <p className="text-[#566273] text-[11px] mb-3">
            Fund your wallet on Hyperliquid testnet to practice trading.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-mono text-[#20e6a3] bg-[#20e6a3]/5 px-2 py-1 rounded flex-1 truncate">{address}</span>
            <button onClick={copy} className="p-1.5 bg-[#262f3a] rounded-lg hover:bg-[#3a4554] transition-colors">
              {copied ? <Check size={13} className="text-[#20e6a3]" /> : <Copy size={13} className="text-[#566273]" />}
            </button>
          </div>
          <a href="https://app.hyperliquid-testnet.xyz/drip" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 bg-[#20e6a3]/10 border border-[#20e6a3]/20 text-[#20e6a3] text-xs font-bold rounded-lg hover:bg-[#20e6a3]/20 transition-colors">
            Open HL Testnet Faucet <ExternalLink size={11} />
          </a>
        </div>

        {/* UPI coming soon */}
        <div className="bg-[#12161a] rounded-xl p-4 border border-[#262f3a] opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">🇮🇳 UPI Deposit</p>
              <p className="text-[#566273] text-[11px]">INR → USDC via Razorpay</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-[#262f3a] text-[#566273] rounded">
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      <button onClick={onNext}
        className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#1bd89a] transition-colors flex items-center justify-center gap-2">
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ── Step 4: Ready ─────────────────────────────────────────────────────────────
function StepReady({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="text-center space-y-6 py-2">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-[#20e6a3]/20 to-[#0ea5e9]/20 rounded-full flex items-center justify-center border border-[#20e6a3]/30">
            <span className="text-5xl">🚀</span>
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#20e6a3] rounded-full flex items-center justify-center">
            <Check size={14} className="text-black" />
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-white font-black text-2xl mb-2">You're All Set!</h2>
        <p className="text-[#566273] text-sm leading-relaxed">
          Your non-custodial wallet is ready.<br />
          Trade BTC, ETH, TSLA, NVDA and 30+ markets with up to 50× leverage.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-left">
        {[
          { icon: "📈", label: "Long BTC",     desc: "Go up on any market" },
          { icon: "📉", label: "Short TSLA",   desc: "Profit from downturns" },
          { icon: "⚡", label: "50× Leverage", desc: "Amplify your edge" },
          { icon: "🔒", label: "TP/SL",        desc: "Auto-protect profits" },
        ].map(f => (
          <div key={f.label} className="bg-[#12161a] rounded-xl p-3 border border-[#262f3a] flex gap-2 items-start">
            <span className="text-xl">{f.icon}</span>
            <div>
              <p className="text-white font-bold text-[11px]">{f.label}</p>
              <p className="text-[#566273] text-[10px]">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onFinish}
        className="w-full py-3 bg-[#20e6a3] text-black font-black text-sm uppercase tracking-wider rounded-xl hover:bg-[#1bd89a] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
        Start Trading <ChevronRight size={16} />
      </button>
    </div>
  );
}

function FullLoader() {
  return (
    <div className="min-h-screen bg-[#07090b] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#20e6a3] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}