"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Overview", href: "/dashboard" },
  { name: "Trade", href: "/dashboard/trade" },
  { name: "On/Off Ramp", href: "/dashboard/on-off-ramp" },
  { name: "Portfolio", href: "/dashboard/portfolio" },
  { name: "History", href: "/dashboard/history" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-72 border-r border-white/10 bg-zinc-950 p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-12">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold">M</div>
        <span className="text-3xl font-bold tracking-tight">Mochtrade</span>
      </div>

      <nav className="space-y-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-lg transition-all ${
              pathname === item.href 
                ? "bg-white text-black font-semibold" 
                : "hover:bg-white/10"
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10 text-sm opacity-70">
        Streak 🔥 <span className="font-bold text-orange-400">7 days</span>
      </div>
    </div>
  );
}