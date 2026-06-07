import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    PRIVY_APP_ID: process.env.PRIVY_APP_ID,
  },
  
};

export default nextConfig;
