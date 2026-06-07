// app/layout.tsx
import type { Metadata } from "next";
import Providers from "./providers"; // Import your client wrapper
import "./globals.css";

// ✅ This works perfectly now because layout is a Server Component!
export const metadata: Metadata = {
  title: "Mochtrade",
  description: "Trade US Stocks with Leverage via Hyperliquid",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Pass children inside the client wrapper here */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}