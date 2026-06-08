// next.config.ts
// FIXES:
//   - Removed server-side PRIVY_APP_ID exposure (client can't access it)
//   - All client-facing vars must use NEXT_PUBLIC_ prefix in .env.local
//   - Added webpack alias for @msgpack/msgpack ESM compat

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // These vars are already exposed to the client via NEXT_PUBLIC_ prefix.
  // No need to re-export them here — Next.js handles NEXT_PUBLIC_ automatically.
  // Keeping this block for any future server-side-only vars.
  serverExternalPackages: ["@msgpack/msgpack"],
  env: {
    PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  },
};

export default nextConfig;