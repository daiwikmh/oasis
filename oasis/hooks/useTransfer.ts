"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { buildTransferTx, getConnection } from "@/lib/chains/solana";
import type { TransferParams } from "@/lib/chains/types";

interface TransferState {
  status: "idle" | "pending" | "success" | "error";
  signature?: string;
  error?: string;
}

export function useTransfer() {
  const { wallets } = useEmbeddedSolanaWallet();
  const queryClient = useQueryClient();
  const [state, setState] = useState<TransferState>({ status: "idle" });

  async function transfer(params: TransferParams) {
    const wallet = wallets?.[0];
    if (!wallet) throw new Error("No wallet connected");

    setState({ status: "pending" });
    try {
      const tx = await buildTransferTx(params, wallet.address);
      const connection = getConnection();
      const signed = await wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, "confirmed");

      setState({ status: "success", signature });
      await queryClient.invalidateQueries({ queryKey: ["pusd-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["pusd-txs"] });
      return signature;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Transfer failed";
      setState({ status: "error", error: message });
      throw e;
    }
  }

  function reset() {
    setState({ status: "idle" });
  }

  return { ...state, transfer, reset };
}
