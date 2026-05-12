import { VersionedTransaction } from "@solana/web3.js";
import { PUSD_ADDRESSES } from "@/lib/tokens/pusd";

const JUP = "https://quote-api.jup.ag/v6";

export interface JupToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface JupQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: { swapInfo: { label: string } }[];
}

export async function fetchQuote(params: {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
}): Promise<JupQuote> {
  const url = new URL(`${JUP}/quote`);
  url.searchParams.set("inputMint", params.inputMint);
  url.searchParams.set("outputMint", params.outputMint);
  url.searchParams.set("amount", params.amount);
  url.searchParams.set("slippageBps", String(params.slippageBps));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Quote fetch failed");
  return res.json() as Promise<JupQuote>;
}

export async function fetchSwapTx(quote: JupQuote, userPublicKey: string): Promise<VersionedTransaction> {
  const res = await fetch(`${JUP}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quoteResponse: quote, userPublicKey, wrapAndUnwrapSol: true }),
  });
  if (!res.ok) throw new Error("Swap tx fetch failed");
  const { swapTransaction } = await res.json() as { swapTransaction: string };
  const txBytes = Buffer.from(swapTransaction, "base64");
  return VersionedTransaction.deserialize(txBytes);
}

export async function searchTokens(query: string): Promise<JupToken[]> {
  const res = await fetch(`https://token.jup.ag/strict`);
  if (!res.ok) return [];
  const tokens = await res.json() as JupToken[];
  const q = query.toLowerCase();
  return tokens.filter(
    (t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
  ).slice(0, 20);
}

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const PUSD_MINT = PUSD_ADDRESSES.solana;
