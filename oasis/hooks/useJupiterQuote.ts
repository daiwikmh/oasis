"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchQuote, type JupQuote } from "@/lib/solana/jupiter";

export function useJupiterQuote(args: {
  inputMint: string;
  outputMint: string;
  amount: string | undefined;
  slippageBps: number;
}) {
  return useQuery<JupQuote>({
    queryKey: ["jup-quote", args.inputMint, args.outputMint, args.amount, args.slippageBps],
    queryFn: () =>
      fetchQuote({
        inputMint: args.inputMint,
        outputMint: args.outputMint,
        amount: args.amount!,
        slippageBps: args.slippageBps,
      }),
    enabled: Boolean(args.amount && args.amount !== "0"),
    staleTime: 8_000,
    refetchInterval: 10_000,
  });
}
