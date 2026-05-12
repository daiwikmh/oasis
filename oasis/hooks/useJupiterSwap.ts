"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { fetchSwapTx, type JupQuote } from "@/lib/solana/jupiter";
import { getConnection } from "@/lib/chains/solana";

interface SwapState {
  status: "idle" | "pending" | "success" | "error";
  signature?: string;
  error?: string;
}

export function useJupiterSwap() {
  const { wallets } = useEmbeddedSolanaWallet();
  const queryClient = useQueryClient();
  const [state, setState] = useState<SwapState>({ status: "idle" });

  async function swap(quote: JupQuote) {
    const wallet = wallets?.[0];
    if (!wallet) throw new Error("No wallet connected");
    setState({ status: "pending" });
    try {
      const tx = await fetchSwapTx(quote, wallet.address);
      const signed = await wallet.signTransaction(tx);
      const connection = getConnection();
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, "confirmed");
      setState({ status: "success", signature });
      await queryClient.invalidateQueries({ queryKey: ["pusd-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["pusd-txs"] });
      return signature;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Swap failed";
      setState({ status: "error", error: message });
      throw e;
    }
  }

  function reset() {
    setState({ status: "idle" });
  }

  return { ...state, swap, reset };
}
