"use client";

import { Wifi } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePusdBalance } from "@/hooks/usePusdBalance";
import { useSolBalance } from "@/hooks/useSolBalance";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { shortenAddress } from "@/lib/utils/validators";

const MIN_SOL_FOR_TX = 0.003;

export function BalanceCard() {
  const { data, isLoading } = usePusdBalance();
  const sol = useSolBalance();
  const { wallets } = useEmbeddedSolanaWallet();
  const address = wallets?.[0]?.address;
  const last4 = address ? address.slice(-4) : "••••";
  const lowSol = sol.data !== undefined && sol.data.sol < MIN_SOL_FOR_TX;

  return (
    <Card tone="dark" className="overflow-hidden relative">
      <div className="flex justify-between items-start">
        <span className="text-inverse/80 font-bold tracking-widest text-base">VISA</span>
        <span className="bg-lime/15 text-lime text-xs font-semibold rounded-full px-3 py-1.5">
          PUSD
        </span>
      </div>

      <div className="mt-6">
        <p className="text-inverse/60 text-xs">Balance</p>
        {isLoading ? (
          <Skeleton className="h-10 w-44 mt-1 bg-inverse/10" />
        ) : (
          <p className="text-inverse text-4xl font-bold">${data?.formatted ?? "0.00"}</p>
        )}
      </div>

      <p className="text-inverse/60 mt-3 tracking-widest">•••• •••• •••• {last4}</p>

      <div className="flex justify-between items-center mt-6">
        <div className="flex flex-col">
          <span className="text-inverse/80 text-xs font-mono">
            {address ? shortenAddress(address, 4) : ""}
          </span>
          <span className={`text-xs mt-0.5 ${lowSol ? "text-warning" : "text-inverse/60"}`}>
            Gas: {sol.data ? sol.data.sol.toFixed(4) : "—"} SOL
            {lowSol ? " · top up to send" : ""}
          </span>
        </div>
        <div className="bg-lime rounded-xl px-3 py-2">
          <Wifi size={18} className="text-ink" />
        </div>
      </div>
    </Card>
  );
}
