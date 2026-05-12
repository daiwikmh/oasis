# 09 — Swaps (Jupiter)

**Platform: web (Next.js 15 App Router).** See spec 01.

> Goal: ship the swap page — PUSD ↔ any SPL token via Jupiter v6 aggregator. Token selector, slippage settings, quote review, sign + broadcast. Page also surfaces a **MoonPay → USDC** CTA as the v1 fiat onramp path (deeplink out, no native fiat onramp; user swaps USDC → PUSD here on return).

**Note:** Step body uses `@privy-io/expo` and Expo Router; web port uses `@privy-io/react-auth` and Next.js routing. Jupiter API calls and `@solana/web3.js` are unchanged.

## Prereqs
- `01`–`05`. Uses `useEmbeddedSolanaWallet` from spec 03 (Privy web SDK).

## Acceptance criteria
- Default pair: PUSD → USDC, 0.5% slippage
- Quote auto-refreshes every 10 seconds while page is visible (`document.visibilityState`)
- Token selector searches Jupiter's strict token list with virtualized list (use `@tanstack/react-virtual`)
- Successful swap updates balances and lands on the same success screen as send
- MoonPay CTA card visible, deeplinks to MoonPay USDC purchase with the user's wallet pre-filled

---

## Step 1 — Jupiter client

`lib/solana/jupiter.ts`:
```ts
import { VersionedTransaction } from "@solana/web3.js";

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
  inAmount: string;          // raw
  outAmount: string;         // raw
  otherAmountThreshold: string;
  priceImpactPct: string;
  slippageBps: number;
  routePlan: { swapInfo: { label: string } }[];
  contextSlot: number;
}

export async function fetchTokenList(): Promise<JupToken[]> {
  const res = await fetch("https://token.jup.ag/strict");
  if (!res.ok) throw new Error("token list");
  return res.json();
}

export async function getQuote(args: {
  inputMint: string; outputMint: string; amount: string; slippageBps: number;
}): Promise<JupQuote> {
  const params = new URLSearchParams({
    inputMint: args.inputMint,
    outputMint: args.outputMint,
    amount: args.amount,
    slippageBps: String(args.slippageBps),
    onlyDirectRoutes: "false",
    asLegacyTransaction: "false",
  });
  const res = await fetch(`${JUP}/quote?${params}`);
  if (!res.ok) throw new Error(`quote ${res.status}`);
  return res.json();
}

export async function buildSwapTx(args: {
  quoteResponse: JupQuote;
  userPublicKey: string;
  prioritizationFeeLamports?: number | "auto";
}): Promise<VersionedTransaction> {
  const res = await fetch(`${JUP}/swap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: args.quoteResponse,
      userPublicKey: args.userPublicKey,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports: args.prioritizationFeeLamports ?? "auto",
      dynamicComputeUnitLimit: true,
    }),
  });
  if (!res.ok) throw new Error(`swap ${res.status}`);
  const { swapTransaction } = await res.json() as { swapTransaction: string };
  const buf = Buffer.from(swapTransaction, "base64");
  return VersionedTransaction.deserialize(buf);
}
```

## Step 2 — Hooks

`hooks/useJupiterTokens.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { fetchTokenList } from "@/lib/solana/jupiter";

export function useJupiterTokens() {
  return useQuery({
    queryKey: ["jup-tokens"],
    queryFn: fetchTokenList,
    staleTime: 24 * 60 * 60_000,
  });
}
```

`hooks/useJupiterQuote.ts`:
```ts
import { useQuery } from "@tanstack/react-query";
import { getQuote } from "@/lib/solana/jupiter";

export function useJupiterQuote(args: {
  inputMint?: string; outputMint?: string; amount?: string; slippageBps: number;
}) {
  const { inputMint, outputMint, amount, slippageBps } = args;
  return useQuery({
    queryKey: ["jup-quote", inputMint, outputMint, amount, slippageBps],
    queryFn: () => getQuote({ inputMint: inputMint!, outputMint: outputMint!, amount: amount!, slippageBps }),
    enabled: !!inputMint && !!outputMint && !!amount && amount !== "0",
    refetchInterval: 10_000,
    staleTime: 8_000,
  });
}
```

`hooks/useJupiterSwap.ts`:
```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEmbeddedSolanaWallet } from "@privy-io/expo";
import { connection } from "@/lib/chains/solana";
import { buildSwapTx, type JupQuote } from "@/lib/solana/jupiter";
import { useWallet } from "@/hooks/useWallet";

export function useJupiterSwap() {
  const { address } = useWallet();
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (quote: JupQuote) => {
      if (!address || !wallet) throw new Error("No wallet");
      const tx = await buildSwapTx({ quoteResponse: quote, userPublicKey: address });
      const provider = await wallet.getProvider();
      const { signature } = await provider.request({
        method: "signAndSendTransaction",
        params: { transaction: tx, connection },
      });
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

## Step 3 — Swap store

`stores/swapStore.ts`:
```ts
import { create } from "zustand";

interface SwapState {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  slippageBps: number;
  set: (p: Partial<SwapState>) => void;
  flip: () => void;
}

export const useSwapStore = create<SwapState>((set) => ({
  inputMint: process.env.EXPO_PUBLIC_PUSD_MINT_SOLANA!,
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  inputAmount: "",
  slippageBps: 50,
  set: (p) => set(p),
  flip: () => set((s) => ({ inputMint: s.outputMint, outputMint: s.inputMint })),
}));
```

## Step 4 — Swap screen

`app/(tabs)/swap.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ArrowDownUp, Settings2 } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SwapInput } from "@/components/swap/SwapInput";
import { useSwapStore } from "@/stores/swapStore";
import { useJupiterQuote } from "@/hooks/useJupiterQuote";
import { parseAmount } from "@/lib/chains/solana";
import { useJupiterTokens } from "@/hooks/useJupiterTokens";

export default function Swap() {
  const { inputMint, outputMint, inputAmount, slippageBps, set, flip } = useSwapStore();
  const { data: tokens } = useJupiterTokens();
  const inputTok = tokens?.find((t) => t.address === inputMint);
  const outputTok = tokens?.find((t) => t.address === outputMint);

  const amountRaw = inputAmount && inputTok
    ? parseAmount(inputAmount, inputTok.decimals).toString()
    : undefined;

  const quote = useJupiterQuote({ inputMint, outputMint, amount: amountRaw, slippageBps });

  const outputDisplay = quote.data && outputTok
    ? (Number(quote.data.outAmount) / 10 ** outputTok.decimals).toFixed(4)
    : "";

  return (
    <ScreenContainer padded={false}>
      <View className="px-5">
        <Header
          title="Swap"
          action={
            <Pressable
              onPress={() => router.push("/swap/slippage")}
              className="bg-surface rounded-full w-10 h-10 items-center justify-center"
            >
              <Settings2 size={18} color="#0E1410" />
            </Pressable>
          }
        />
      </View>

      <View className="px-5 mt-4 gap-2">
        <SwapInput
          label="From"
          token={inputTok}
          amount={inputAmount}
          onAmountChange={(v) => set({ inputAmount: v })}
          onPickToken={() => router.push({ pathname: "/swap/select-token", params: { side: "input" } })}
        />

        <View className="items-center -my-3 z-10">
          <Pressable onPress={flip} className="w-12 h-12 rounded-full bg-lime items-center justify-center">
            <ArrowDownUp size={20} color="#0E1410" />
          </Pressable>
        </View>

        <SwapInput
          label="To"
          token={outputTok}
          amount={outputDisplay}
          editable={false}
          onPickToken={() => router.push({ pathname: "/swap/select-token", params: { side: "output" } })}
        />

        {quote.data && (
          <Card className="mt-2">
            <Row label="Rate" value={`1 ${inputTok?.symbol} ≈ ${(Number(outputDisplay) / Math.max(Number(inputAmount), 0.000001)).toFixed(4)} ${outputTok?.symbol}`} />
            <Row label="Price impact" value={`${parseFloat(quote.data.priceImpactPct).toFixed(2)}%`}
                 emphasis={parseFloat(quote.data.priceImpactPct) > 1 ? "warn" : undefined} />
            <Row label="Slippage" value={`${(slippageBps / 100).toFixed(2)}%`} />
            <Row label="Route" value={quote.data.routePlan.map((r) => r.swapInfo.label).join(" → ")} />
          </Card>
        )}
      </View>

      <View className="flex-1" />
      <View className="px-5 pb-6">
        <Button
          disabled={!quote.data}
          loading={quote.isFetching && !quote.data}
          onPress={() => router.push("/swap/confirm")}
        >
          Review Swap
        </Button>
      </View>
    </ScreenContainer>
  );
}

function Row({ label, value, emphasis }: { label: string; value: string; emphasis?: "warn" }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-muted">{label}</Text>
      <Text className={emphasis === "warn" ? "text-warning" : ""}>{value}</Text>
    </View>
  );
}
```

## Step 5 — SwapInput component

`components/swap/SwapInput.tsx`:
```tsx
import { View, Text, TextInput, Pressable, Image } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import type { JupToken } from "@/lib/solana/jupiter";

export function SwapInput({
  label, token, amount, onAmountChange, onPickToken, editable = true,
}: {
  label: string;
  token?: JupToken;
  amount: string;
  onAmountChange?: (v: string) => void;
  onPickToken: () => void;
  editable?: boolean;
}) {
  return (
    <Card>
      <Text className="text-muted text-xs">{label}</Text>
      <View className="flex-row items-center mt-1">
        <TextInput
          value={amount}
          onChangeText={onAmountChange}
          editable={editable}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor="#7A867A"
          className="flex-1 text-h1 text-ink"
        />
        <Pressable onPress={onPickToken} className="flex-row items-center bg-canvas-alt rounded-full px-3 py-2">
          {token?.logoURI && (
            <Image source={{ uri: token.logoURI }} style={{ width: 20, height: 20, borderRadius: 10 }} />
          )}
          <Text className="ml-2 font-semi">{token?.symbol ?? "—"}</Text>
          <ChevronDown size={16} color="#0E1410" />
        </Pressable>
      </View>
    </Card>
  );
}
```

## Step 6 — Token selector

`app/swap/select-token.tsx`:
```tsx
import { useState } from "react";
import { View, Text, Pressable, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Input } from "@/components/ui/Input";
import { useJupiterTokens } from "@/hooks/useJupiterTokens";
import { useSwapStore } from "@/stores/swapStore";

export default function SelectToken() {
  const { side } = useLocalSearchParams<{ side: "input" | "output" }>();
  const { data = [] } = useJupiterTokens();
  const set = useSwapStore((s) => s.set);
  const [q, setQ] = useState("");

  const filtered = q
    ? data.filter((t) =>
        t.symbol.toLowerCase().includes(q.toLowerCase()) ||
        t.name.toLowerCase().includes(q.toLowerCase()))
    : data.slice(0, 50);

  return (
    <ScreenContainer>
      <Header title="Select token" />
      <Input placeholder="Search token" value={q} onChangeText={setQ} />
      <View className="flex-1 mt-4">
        <FlashList
          data={filtered}
          estimatedItemSize={56}
          keyExtractor={(t) => t.address}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                set({ [side === "input" ? "inputMint" : "outputMint"]: item.address });
                router.back();
              }}
              className="flex-row items-center py-3"
            >
              {item.logoURI && (
                <Image source={{ uri: item.logoURI }} style={{ width: 32, height: 32, borderRadius: 16 }} />
              )}
              <View className="ml-3">
                <Text className="text-body">{item.symbol}</Text>
                <Text className="text-muted text-xs">{item.name}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    </ScreenContainer>
  );
}
```

## Step 7 — Slippage

`app/swap/slippage.tsx`:
```tsx
import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSwapStore } from "@/stores/swapStore";

export default function Slippage() {
  const { slippageBps, set } = useSwapStore();
  const [custom, setCustom] = useState("");

  const presets = [10, 50, 100];

  return (
    <ScreenContainer>
      <Header title="Slippage tolerance" />
      <View className="flex-row gap-2 mt-4">
        {presets.map((bps) => (
          <Pill key={bps} active={slippageBps === bps} onPress={() => set({ slippageBps: bps })}>
            {(bps / 100).toFixed(1)}%
          </Pill>
        ))}
      </View>
      <Input
        label="Custom (%)"
        keyboardType="decimal-pad"
        value={custom}
        onChangeText={(v) => { setCustom(v); const n = Math.round(parseFloat(v) * 100); if (!isNaN(n)) set({ slippageBps: n }); }}
      />
      <View className="flex-1" />
      <Button onPress={() => router.back()}>Done</Button>
    </ScreenContainer>
  );
}
```

## Step 8 — Confirm

`app/swap/confirm.tsx`:
```tsx
import { View, Text } from "react-native";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useSwapStore } from "@/stores/swapStore";
import { useJupiterQuote } from "@/hooks/useJupiterQuote";
import { useJupiterSwap } from "@/hooks/useJupiterSwap";
import { useJupiterTokens } from "@/hooks/useJupiterTokens";
import { parseAmount } from "@/lib/chains/solana";

export default function ConfirmSwap() {
  const { inputMint, outputMint, inputAmount, slippageBps } = useSwapStore();
  const { data: tokens } = useJupiterTokens();
  const inTok = tokens?.find((t) => t.address === inputMint);
  const outTok = tokens?.find((t) => t.address === outputMint);

  const amountRaw = inputAmount && inTok ? parseAmount(inputAmount, inTok.decimals).toString() : undefined;
  const quote = useJupiterQuote({ inputMint, outputMint, amount: amountRaw, slippageBps });
  const swap = useJupiterSwap();

  const submit = async () => {
    if (!quote.data) return;
    const auth = await LocalAuthentication.authenticateAsync({ promptMessage: "Confirm Swap" });
    if (!auth.success) return;
    const sig = await swap.mutateAsync(quote.data);
    router.replace({ pathname: "/send/success", params: { sig, amount: inputAmount, to: outTok?.symbol ?? "" } });
  };

  return (
    <ScreenContainer>
      <Header title="Review swap" />
      <Card className="mt-4">
        <Text className="text-muted text-xs">You pay</Text>
        <Text className="text-h2">{inputAmount} {inTok?.symbol}</Text>
        <View className="hairline my-3" />
        <Text className="text-muted text-xs">You receive (min)</Text>
        <Text className="text-h2">
          {quote.data && outTok ? (Number(quote.data.otherAmountThreshold) / 10 ** outTok.decimals).toFixed(4) : "—"} {outTok?.symbol}
        </Text>
      </Card>

      <View className="flex-1" />
      <Button onPress={submit} loading={swap.isPending} disabled={!quote.data}>
        Sign & Swap
      </Button>
    </ScreenContainer>
  );
}
```

## Done when
- Swap PUSD → USDC works on mainnet (devnet has no Jupiter)
- Quote refreshes visibly (you can watch the output update)
- Selecting a different output token recalculates immediately
- Price impact >1% shows in warning color; >3% blocks the button (add to confirm screen)
