"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { authenticated, ready, logout } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  if (!ready) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <header className="border-b border-white/10 p-6 flex justify-between items-center">
          <h1 className="text-3xl font-semibold">Dashboard</h1>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm border border-white/30 rounded-xl hover:bg-white/10"
          >
            Logout
          </button>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}