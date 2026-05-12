import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@privy-io/react-auth",
    "@solana-program/token",
    "@solana-program/token-2022",
  ],
  webpack: (cfg) => {
    cfg.resolve.fallback = { ...cfg.resolve.fallback, fs: false };
    return cfg;
  },
};

export default config;
