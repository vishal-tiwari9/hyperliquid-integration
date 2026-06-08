"use client";
// app/providers.tsx
// BUG FIX: was using PRIVY_APP_ID (server-side only).
// Must be NEXT_PUBLIC_PRIVY_APP_ID for client components.
// ADDED: embeddedWallets.createOnLogin = 'all-users'

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 2 },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
        config={{
          appearance: {
            theme: "dark",
            accentColor: "#20e6a3",
            logo: undefined,
          },
          // ── Auto-create Ethereum embedded wallet for every user ────────────
          embeddedWallets: {
            createOnLogin: "all-users",
            showWalletUIs: false, // we handle wallet UI ourselves
          },
          loginMethods: ["email", "google"],
          // ── Lock embedded wallet to Arbitrum (HL's settlement chain) ───────
          defaultChain: {
            id: 42161,
            name: "Arbitrum One",
            network: "arbitrum",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: {
              default: { http: ["https://arb1.arbitrum.io/rpc"] },
              public: { http: ["https://arb1.arbitrum.io/rpc"] },
            },
          },
          supportedChains: [
            {
              id: 42161,
              name: "Arbitrum One",
              network: "arbitrum",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: {
                default: { http: ["https://arb1.arbitrum.io/rpc"] },
                public: { http: ["https://arb1.arbitrum.io/rpc"] },
              },
            },
          ],
        }}
      >
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}