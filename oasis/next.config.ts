import path from "path";
import type { NextConfig } from "next";

const STUB = path.resolve(__dirname, "lib/shims/solana-program-stub.js");

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@privy-io/react-auth"],
  webpack: (cfg) => {
    cfg.resolve.fallback = { ...cfg.resolve.fallback, fs: false };
    cfg.resolve.alias = {
      ...cfg.resolve.alias,
      "@solana-program/system":     STUB,
      "@solana-program/token":      STUB,
      "@solana-program/token-2022": STUB,
    };
    return cfg;
  },
};

export default config;
