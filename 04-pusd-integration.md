# 04 — PUSD Integration

**Platform: web (Next.js 15 App Router).** See spec 01. Module is mostly platform-neutral — `@solana/web3.js` and `@solana/spl-token` work in the browser.

> Goal: production-grade PUSD plumbing — token constants, balance reads, transfers, transaction history. Solana-only in v1. The `ChainAdapter` interface is intentionally trimmed: do not build EVM/TRON stubs speculatively (per `project_oasis` memory rule — multi-chain is v2).

**Note:** Step body imports `@privy-io/expo`; the web equivalent is `@privy-io/react-auth` (`useEmbeddedSolanaWallet` exists in both). All `lib/` code stays framework-free.

## Prereqs
- `01`, `02`, `03`

## Acceptance criteria
- `usePusdBalance()` returns the connected wallet's PUSD balance, refetches on focus/visibility-change, and survives ATA non-existence (returns 0)
- `useTransfer()` builds, signs (via Privy web), and sends a PUSD SPL transfer; auto-creates recipient ATA if missing
- `useTransactions()` returns last 50 PUSD transactions for the wallet
- All amounts are `bigint` internally; rendering goes through `formatPusd()`
- `lib/chains/solana.ts` has zero React/Next dependencies

---

## Step 1 — Token registry

`lib/tokens/pusd.ts`:
```ts
export const PUSD_DECIMALS = 6;
export const PUSD_SYMBOL = "PUSD";

export const PUSD_ADDRESSES = {
  ethereum: "0xfaf0cee6b20e2aaa4b80748a6af4cd89609a3d78",
  solana:   process.env.EXPO_PUBLIC_PUSD_MINT_SOLANA!, // ⚠️ confirm canonical
  bnb:      "TBD",
  tron:     "TBD",
  adi:      "TBD",
} as const;

export type SupportedChain = keyof typeof PUSD_ADDRESSES;

export const CIRCULATION_API = "https://www.palmusd.com/api/v1/circulation";
```

## Step 2 — Chain adapter interface

`lib/chains/types.ts`:
```ts
export interface TokenBalance {
  raw: bigint;       // smallest units
  formatted: string; // human-readable, e.g. "1,250.00"
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  amount: bigint;
  timestamp: number;
  direction: "in" | "out";
  memo?: string;
}

export interface TransferParams {
  to: string;
  amount: bigint; // raw units
  memo?: string;
}

export interface ChainAdapter {
  chain: string;
  getBalance(address: string): Promise<TokenBalance>;
  getTransfers(address: string, limit?: number): Promise<TokenTransfer[]>;
  buildTransfer(from: string, params: TransferParams): Promise<unknown>; // chain-specific tx
}
```

## Step 3 — Solana adapter

`lib/chains/solana.ts`:
```ts
import {
  Connection, PublicKey, VersionedTransaction, TransactionMessage, ComputeBudgetProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress, getAccount, createTransferCheckedInstruction,
  createAssociatedTokenAccountInstruction, TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { PUSD_ADDRESSES, PUSD_DECIMALS } from "@/lib/tokens/pusd";
import type { ChainAdapter, TokenBalance, TokenTransfer, TransferParams } from "./types";

const RPC = process.env.EXPO_PUBLIC_SOLANA_RPC!;
const HELIUS_KEY = process.env.EXPO_PUBLIC_HELIUS_KEY!;
const HELIUS_API = `https://api.helius.xyz/v0`;

export const connection = new Connection(RPC, "confirmed");
export const PUSD_MINT = new PublicKey(PUSD_ADDRESSES.solana);

export function formatRaw(raw: bigint, decimals = PUSD_DECIMALS): string {
  const s = raw.toString().padStart(decimals + 1, "0");
  const head = s.slice(0, -decimals) || "0";
  const tail = s.slice(-decimals).slice(0, 2);
  const headWithCommas = head.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${headWithCommas}.${tail}`;
}

export function parseAmount(input: string, decimals = PUSD_DECIMALS): bigint {
  const [whole = "0", frac = ""] = input.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return BigInt(whole + fracPadded);
}

export const solanaAdapter: ChainAdapter = {
  chain: "solana",

  async getBalance(address) {
    try {
      const owner = new PublicKey(address);
      const ata = await getAssociatedTokenAddress(PUSD_MINT, owner);
      const account = await getAccount(connection, ata);
      const raw = BigInt(account.amount.toString());
      return { raw, formatted: formatRaw(raw) };
    } catch (e: any) {
      // ATA doesn't exist yet = balance is 0
      if (e.name === "TokenAccountNotFoundError") {
        return { raw: 0n, formatted: "0.00" };
      }
      throw e;
    }
  },

  async getTransfers(address, limit = 50) {
    // Helius enhanced transactions filtered by mint
    const url = `${HELIUS_API}/addresses/${address}/transactions?api-key=${HELIUS_KEY}&limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Helius ${res.status}`);
    const txs = await res.json();
    return (txs as any[])
      .flatMap((tx) =>
        (tx.tokenTransfers ?? [])
          .filter((t: any) => t.mint === PUSD_ADDRESSES.solana)
          .map((t: any) => ({
            hash: tx.signature,
            from: t.fromUserAccount,
            to: t.toUserAccount,
            amount: BigInt(Math.round(t.tokenAmount * 10 ** PUSD_DECIMALS)),
            timestamp: tx.timestamp * 1000,
            direction: t.fromUserAccount === address ? "out" : "in",
          } as TokenTransfer))
      );
  },

  async buildTransfer(fromAddr, { to, amount }) {
    const from = new PublicKey(fromAddr);
    const toPk = new PublicKey(to);
    const fromAta = await getAssociatedTokenAddress(PUSD_MINT, from);
    const toAta = await getAssociatedTokenAddress(PUSD_MINT, toPk);

    const ixs = [];

    // Priority fee (dynamic)
    ixs.push(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50_000 }));
    ixs.push(ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }));

    // Create recipient ATA if missing
    const toInfo = await connection.getAccountInfo(toAta);
    if (!toInfo) {
      ixs.push(
        createAssociatedTokenAccountInstruction(from, toAta, toPk, PUSD_MINT)
      );
    }

    ixs.push(
      createTransferCheckedInstruction(
        fromAta, PUSD_MINT, toAta, from, amount, PUSD_DECIMALS, [], TOKEN_PROGRAM_ID
      )
    );

    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const msg = new TransactionMessage({
      payerKey: from,
      recentBlockhash: blockhash,
      instructions: ixs,
    }).compileToV0Message();

    return new VersionedTransaction(msg);
  },
};
```

## Step 4 — Hooks

`hooks/usePusdBalance.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { solanaAdapter } from "@/lib/chains/solana";
import { useWallet } from "@/hooks/useWallet";

export function usePusdBalance() {
  const { address } = useWallet();
  return useQuery({
    queryKey: ["pusd-balance", address],
    queryFn: () => solanaAdapter.getBalance(address!),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
```

`hooks/useTransactions.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { solanaAdapter } from "@/lib/chains/solana";
import { useWallet } from "@/hooks/useWallet";

export function useTransactions(limit = 50) {
  const { address } = useWallet();
  return useQuery({
    queryKey: ["pusd-txs", address, limit],
    queryFn: () => solanaAdapter.getTransfers(address!, limit),
    enabled: !!address,
    staleTime: 30_000,
  });
}
```

`hooks/useTransfer.ts`:
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmbeddedSolanaWallet } from "@privy-io/expo";
import { solanaAdapter, connection } from "@/lib/chains/solana";
import { useWallet } from "@/hooks/useWallet";

export function useTransfer() {
  const { address } = useWallet();
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount }: { to: string; amount: bigint }) => {
      if (!address || !wallet) throw new Error("No wallet");

      const tx = await solanaAdapter.buildTransfer(address, { to, amount });

      // Simulate first
      const sim = await connection.simulateTransaction(tx as any, { sigVerify: false });
      if (sim.value.err) throw new Error("Transaction would fail: " + JSON.stringify(sim.value.err));

      // Privy signs + sends
      const provider = await wallet.getProvider();
      const { signature } = await provider.request({
        method: "signAndSendTransaction",
        params: { transaction: tx, connection },
      });

      // Confirm
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

      return signature;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pusd-balance"] });
      qc.invalidateQueries({ queryKey: ["pusd-txs"] });
    },
  });
}
```

## Step 5 — Format utilities

`lib/utils/format.ts`:
```ts
import { formatRaw, parseAmount } from "@/lib/chains/solana";

export const formatPusd = (raw: bigint) => `$${formatRaw(raw)}`;
export const formatPusdShort = (raw: bigint) => formatRaw(raw);
export { parseAmount };

export const shortAddr = (addr: string, head = 4, tail = 4) =>
  addr.length <= head + tail ? addr : `${addr.slice(0, head)}…${addr.slice(-tail)}`;

export const relTime = (ms: number) => {
  const diff = Date.now() - ms;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(ms).toLocaleDateString();
};
```

## Step 6 — Address validation

`lib/utils/validators.ts`:
```ts
import { PublicKey } from "@solana/web3.js";

export function isValidSolanaAddress(addr: string): boolean {
  try {
    const pk = new PublicKey(addr);
    return PublicKey.isOnCurve(pk.toBytes());
  } catch { return false; }
}
```

## Step 7 — Circulation widget (uses public Palm API)

`hooks/useCirculation.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { CIRCULATION_API } from "@/lib/tokens/pusd";

export function useCirculation() {
  return useQuery({
    queryKey: ["pusd-circulation"],
    queryFn: async () => {
      const res = await fetch(CIRCULATION_API);
      if (!res.ok) throw new Error("Circulation API");
      return res.json() as Promise<{
        totalSupply: number;
        chains: Record<string, number>;
        attestationDate: string;
      }>;
    },
    staleTime: 60 * 60_000, // 1h
  });
}
```

## Step 8 — Future EVM/TRON adapters (stubs)

`lib/chains/evm.ts`:
```ts
import type { ChainAdapter } from "./types";

export const evmAdapter: ChainAdapter = {
  chain: "ethereum",
  async getBalance() { throw new Error("EVM adapter not implemented in v1"); },
  async getTransfers() { throw new Error("EVM adapter not implemented in v1"); },
  async buildTransfer() { throw new Error("EVM adapter not implemented in v1"); },
};
```

When adding EVM in v2: install `ethers@^6`, mirror the Solana adapter shape using `Contract.balanceOf` / `transfer`. The PUSD ABI is the standard ERC-20 ABI.

## Done when
- Logging in shows correct PUSD balance on Solana devnet (after airdropping test tokens to your wallet)
- Sending 0.01 PUSD to another wallet succeeds; recipient sees the inbound; tx appears in history within ~15s
- Killing connectivity mid-send shows a useful error (not a silent fail)
