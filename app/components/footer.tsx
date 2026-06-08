import { Coffee } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 

export function Footer() {
  return (
    <footer className="w-full bg-black border-t border-zinc-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-10 md:px-12">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="p-1.5 bg-[#20e6a3]/10 rounded-full">
            <Image 
      src="/logo.png" 
      alt="MochaTrade" 
      width={64} 
      height={64} 
      className="animate-pulse" 
    />
          </div>
          <span className="text-xl font-light tracking-wider text-white">
            Mocha<span className="italic font-serif">trade</span>
          </span>
        </Link>

        {/* Social Links */}
        <div className="flex items-center gap-8">
          <Link
            href="https://x.com/mochatrade" // Update with your actual handle
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition-colors hover:text-[#20e6a3]"
            aria-label="X (formerly Twitter)"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </Link>
          <Link
            href="https://discord.com" // Recommended for Perp Marketplaces
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 transition-colors hover:text-[#20e6a3]"
            aria-label="Discord"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.972.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.126 10.29 10.29 0 0 0 .372-.29.076.076 0 0 1 .077-.01 10.513 10.513 0 0 0 13.38 0 .075.075 0 0 1 .077.01 10.29 10.29 0 0 0 .372.29.077.077 0 0 1-.008.126 13.08 13.08 0 0 1-1.872.892.076.076 0 0 0-.041.106c.35.695.772 1.362 1.226 1.972a.077.077 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.057c.504-5.294-.835-9.843-3.69-14.475a.075.075 0 0 0-.032-.027zM8.02 15.332c-1.18 0-2.155-1.085-2.155-2.418 0-1.332.955-2.418 2.155-2.418 1.21 0 2.176 1.096 2.155 2.418 0 1.333-.955 2.418-2.155 2.418zm7.974 0c-1.18 0-2.155-1.085-2.155-2.418 0-1.332.955-2.418 2.155-2.418 1.21 0 2.176 1.096 2.155 2.418 0 1.333-.955 2.418-2.155 2.418z" />
            </svg>
          </Link>
        </div>

        {/* Legal Links */}
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-sm text-zinc-500 hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="text-sm text-zinc-500 hover:text-white transition-colors">Terms</Link>
          <span className="text-xs text-zinc-700">© 2026 MochaTrade</span>
        </div>
      </div>
    </footer>
  );
}