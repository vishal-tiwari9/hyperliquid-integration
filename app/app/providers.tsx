// app/providers.tsx
"use client"; // This handles context on the client side

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.PRIVY_APP_ID|| ""}
      config={{ appearance: { theme: "dark" } }}
    >
      {children}
    </PrivyProvider>
  );
}