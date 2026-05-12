"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: true, retry: 1 },
        },
      }),
  );

  if (!PRIVY_APP_ID) {
    return <SetupScreen />;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={{
        loginMethods: ["email"],
        embeddedWallets: {
          createOnLogin: "users-without-wallets",
          solana: { createOnLogin: "users-without-wallets" },
        },
        appearance: { theme: "light", accentColor: "#C8F560" },
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
  );
}

function SetupScreen() {
  return (
    <main
      className="min-h-screen p-6 md:p-12 flex items-center"
      style={{
        background: "#09090B",
        color: "#FAFAFA",
        fontFamily: "var(--font-grotesk), system-ui, sans-serif",
      }}
    >
      <div className="max-w-3xl w-full space-y-8">
        <span
          className="inline-block text-xs uppercase tracking-widest font-semibold px-3 py-1.5"
          style={{ background: "#DFE104", color: "#000" }}
        >
          Setup required
        </span>

        <h1
          className="font-bold uppercase tracking-tighter leading-[0.85]"
          style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)" }}
        >
          Set your <span style={{ color: "#DFE104" }}>Privy</span> app id.
        </h1>

        <p className="text-lg md:text-xl leading-tight" style={{ color: "#A1A1AA" }}>
          Oasis needs <code className="font-mono text-base px-1" style={{ color: "#FAFAFA" }}>
            NEXT_PUBLIC_PRIVY_APP_ID
          </code>{" "}
          before it can render anything authenticated. Set it in{" "}
          <code className="font-mono text-base px-1" style={{ color: "#FAFAFA" }}>
            .env.local
          </code>{" "}
          and restart <code className="font-mono text-base px-1">npm run dev</code>.
        </p>

        <pre
          className="p-6 text-sm md:text-base overflow-x-auto"
          style={{ background: "#27272A", color: "#FAFAFA", border: "2px solid #3F3F46" }}
        >
{`# oasis/.env.local
NEXT_PUBLIC_PRIVY_APP_ID=cm...your-app-id
NEXT_PUBLIC_PRIVY_CLIENT_ID=client-...
NEXT_PUBLIC_HELIUS_RPC_URL=https://...
NEXT_PUBLIC_API_URL=http://localhost:8787`}
        </pre>

        <ol className="space-y-4 text-base md:text-lg" style={{ color: "#A1A1AA" }}>
          <Step n="01">
            Create an app at{" "}
            <a
              href="https://dashboard.privy.io"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
              style={{ color: "#DFE104" }}
            >
              dashboard.privy.io
            </a>
          </Step>
          <Step n="02">
            Enable <strong style={{ color: "#FAFAFA" }}>Email</strong> login and{" "}
            <strong style={{ color: "#FAFAFA" }}>Solana embedded wallets</strong>{" "}
            (users-without-wallets)
          </Step>
          <Step n="03">
            Add <code className="font-mono">http://localhost:3000</code> to allowed origins
          </Step>
          <Step n="04">Paste the App ID into .env.local. Restart dev server.</Step>
        </ol>

        <p className="text-xs uppercase tracking-widest font-semibold pt-4" style={{ color: "#3F3F46" }}>
          This screen only renders when the env var is missing.
        </p>
      </div>
    </main>
  );
}

function Step({ n, children }: { n: string; children: ReactNode }) {
  return (
    <li className="flex items-baseline gap-4 md:gap-6">
      <span
        className="font-bold uppercase tracking-tighter shrink-0"
        style={{ color: "#27272A", fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        {n}
      </span>
      <span className="leading-tight">{children}</span>
    </li>
  );
}
