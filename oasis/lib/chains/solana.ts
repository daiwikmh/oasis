import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PUSD_ADDRESSES, PUSD_DECIMALS, formatPusd } from "@/lib/tokens/pusd";
import type { ChainAdapter, TokenBalance, TokenTransfer, TransferParams } from "./types";

export function getConnection(): Connection {
  const rpc = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
  if (!rpc) {
    throw new Error(
      "NEXT_PUBLIC_HELIUS_RPC_URL is not set. Set it in oasis/.env.local — public RPCs will rate-limit.",
    );
  }
  return new Connection(rpc, "confirmed");
}

const MINT = new PublicKey(PUSD_ADDRESSES.solana);

export async function buildTransferTx(params: TransferParams, fromAddress: string): Promise<Transaction> {
  const connection = getConnection();
  const from = new PublicKey(fromAddress);
  const to = new PublicKey(params.to);

  const fromAta = await getAssociatedTokenAddress(MINT, from);
  const toAta = await getAssociatedTokenAddress(MINT, to);

  const tx = new Transaction();

  try {
    await getAccount(connection, toAta);
  } catch {
    tx.add(createAssociatedTokenAccountInstruction(from, toAta, to, MINT));
  }

  tx.add(createTransferInstruction(fromAta, toAta, from, params.amount, [], TOKEN_PROGRAM_ID));

  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = from;

  return tx;
}

export interface TransferFeeEstimate {
  baseFeeLamports:    number;
  ataRentLamports:    number;
  totalLamports:      number;
  totalSol:           number;
  needsAtaCreation:   boolean;
}

const SIGNATURE_FEE_LAMPORTS = 5000;
const ATA_RENT_LAMPORTS      = 2_039_280;

export async function estimateTransferFee(toAddress: string): Promise<TransferFeeEstimate> {
  const connection = getConnection();
  const to = new PublicKey(toAddress);
  const toAta = await getAssociatedTokenAddress(MINT, to);
  let needsAtaCreation = false;
  try {
    await getAccount(connection, toAta);
  } catch {
    needsAtaCreation = true;
  }
  const ataRentLamports = needsAtaCreation ? ATA_RENT_LAMPORTS : 0;
  const totalLamports = SIGNATURE_FEE_LAMPORTS + ataRentLamports;
  return {
    baseFeeLamports: SIGNATURE_FEE_LAMPORTS,
    ataRentLamports,
    totalLamports,
    totalSol:        totalLamports / 1_000_000_000,
    needsAtaCreation,
  };
}

export const solanaAdapter: ChainAdapter = {
  async getBalance(walletAddress): Promise<TokenBalance> {
    const connection = getConnection();
    const owner = new PublicKey(walletAddress);
    const ata = await getAssociatedTokenAddress(MINT, owner);
    try {
      const account = await getAccount(connection, ata);
      const raw = BigInt(account.amount.toString());
      return { raw, formatted: formatPusd(raw) };
    } catch {
      return { raw: 0n, formatted: "0.00" };
    }
  },

  async getTransactions(walletAddress, limit = 50): Promise<TokenTransfer[]> {
    const connection = getConnection();
    const owner = new PublicKey(walletAddress);
    const ata = await getAssociatedTokenAddress(MINT, owner);

    const sigs = await connection.getSignaturesForAddress(ata, { limit });
    if (!sigs.length) return [];

    const txs = await connection.getParsedTransactions(
      sigs.map((s) => s.signature),
      { maxSupportedTransactionVersion: 0 }
    );

    const results: TokenTransfer[] = [];

    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i];
      const sig = sigs[i];
      if (!tx || !sig) continue;

      for (const ix of tx.transaction.message.instructions) {
        if (!("parsed" in ix)) continue;
        const p = ix.parsed as {
          type: string;
          info: { source: string; destination: string; amount: string };
        };
        if (p.type !== "transfer" && p.type !== "transferChecked") continue;

        const rawAmount = BigInt(p.info.amount ?? "0");
        const direction: "in" | "out" = p.info.destination === ata.toBase58() ? "in" : "out";

        results.push({
          hash: sig.signature,
          from: p.info.source,
          to: p.info.destination,
          amount: rawAmount,
          timestamp: (sig.blockTime ?? 0) * 1000,
          direction,
        });
      }
    }

    return results;
  },
};
