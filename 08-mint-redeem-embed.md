# 08 — Reserves Transparency

**Platform: web (Next.js 15 App Router).** See spec 01. *(File is named `08-mint-redeem-embed.md` for backwards reference; the spec scope has been replaced — Palm has no fiat onramp API.)*

> Goal: ship the Reserves Transparency page (`/reserves`) that fetches Palm's two public read-only endpoints (`/circulation`, `/reserves`) and renders PUSD's circulation supply (with chain breakdown) and proof-of-reserves attestation. Public route — viewable without login.

## Why this replaces the original Mint/Redeem spec
**Palm is a token issuer, not a payment processor.** Confirmed 2026-05-08: there is no Palm-hosted mint API, no API key, no sandbox, no KYC handoff, no webhooks. The original spec was based on a fictional onramp surface and has been retired.

User-facing "Get PUSD" paths in v1:
1. **Receive** PUSD from another wallet (spec 07)
2. **Swap** SOL/USDC → PUSD via Jupiter (spec 09)
3. **MoonPay deeplink** (USDC purchase) → swap to PUSD via Jupiter (spec 09)

None of these involve Palm. The Reserves page surfaces transparency data only.

## Prereqs
- `01`, `02`. No backend dependency — endpoints are public, fetched from the client. No auth.

## Acceptance criteria
- `/reserves` renders publicly (no login required)
- Total circulating supply displayed with per-chain breakdown
- Reserves data displayed with attestation date and any per-asset breakdown Palm exposes
- Page handles API failure gracefully (shows last-known cache + a "stale" indicator)
- Linked from the Home page footer and the Profile page

## Endpoints
- `GET https://www.palmusd.com/api/v1/circulation`
- `GET https://www.palmusd.com/api/v1/reserves`

## Note on the body below
**The step-by-step body is OBSOLETE.** It implements the deleted mint/redeem-embed flow (state machine, KYC gates, rail picker, payment instructions, success polling, etc.) against a Palm API that doesn't exist. Treat all of it as deletion candidates — kept in place only until the code-rewrite pass replaces it with the Reserves page implementation.

## Stale body (do not implement)

---

## Step 1 — State machine

`stores/mintStore.ts`:
```ts
import { create } from "zustand";

export type Rail = "card" | "ach" | "wire" | "sepa";
export type MintStatus = "idle" | "submitted" | "awaiting_payment" | "confirming" | "completed" | "failed";

interface MintDraft {
  direction: "mint" | "redeem";
  amountFiat: string;
  currency: "USD";
  rail: Rail;
  reference?: string;        // backend-issued reference
  status: MintStatus;
  paymentInstructions?: any; // rail-specific
  error?: string;
}

interface MintState extends MintDraft {
  set: (patch: Partial<MintDraft>) => void;
  reset: () => void;
}

const init: MintDraft = {
  direction: "mint",
  amountFiat: "",
  currency: "USD",
  rail: "card",
  status: "idle",
};

export const useMintStore = create<MintState>((set) => ({
  ...init,
  set: (patch) => set(patch),
  reset: () => set(init),
}));
```

## Step 2 — Backend client

`lib/api/mint.ts`:
```ts
const API = process.env.EXPO_PUBLIC_API_URL!;

export interface CreateMintIntent {
  walletAddress: string;
  amountFiat: number;
  currency: "USD";
  rail: "card" | "ach" | "wire" | "sepa";
  direction: "mint" | "redeem";
}

export interface MintIntent {
  reference: string;
  status: "awaiting_payment" | "processing" | "completed" | "failed";
  paymentInstructions: unknown;
  feeFiat: number;
  pusdAmount: string;     // raw units
  expiresAt: string;
}

export async function createMintIntent(privyToken: string, body: CreateMintIntent): Promise<MintIntent> {
  const res = await fetch(`${API}/v1/mint-intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${privyToken}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`mint-intent ${res.status}`);
  return res.json();
}

export async function getMintIntent(privyToken: string, ref: string): Promise<MintIntent> {
  const res = await fetch(`${API}/v1/mint-intents/${ref}`, {
    headers: { Authorization: `Bearer ${privyToken}` },
  });
  if (!res.ok) throw new Error(`mint-intent get ${res.status}`);
  return res.json();
}
```

> Backend (spec 12) proxies these to Palm's actual endpoints once we have them. For local dev, backend can return mocked instructions so the UI is testable.

## Step 3 — Entry screen

`app/mint/index.tsx`:
```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/stores/userStore";
import { useMintStore } from "@/stores/mintStore";

export default function MintEntry() {
  const { direction = "mint" } = useLocalSearchParams<{ direction?: "mint" | "redeem" }>();
  const kycTier = useUserStore((s) => s.kycTier);
  const setMint = useMintStore((s) => s.set);

  const [amount, setAmount] = useState("");
  const isMint = direction === "mint";
  const Icon = isMint ? ArrowDownToLine : ArrowUpFromLine;

  const next = () => {
    if (kycTier === "none") {
      router.push("/(auth)/kyc");
      return;
    }
    setMint({ direction, amountFiat: amount });
    router.push("/mint/rail");
  };

  return (
    <ScreenContainer>
      <Header title={isMint ? "Get PUSD" : "Cash out"} />

      <View className="items-center mt-8 gap-3">
        <View className="bg-lime rounded-full w-16 h-16 items-center justify-center">
          <Icon size={28} color="#0E1410" />
        </View>
        <Text className="text-h2">{isMint ? "Convert USD to PUSD" : "Convert PUSD to USD"}</Text>
        <Text className="text-muted text-center">
          {isMint ? "Fully reserved 1:1 by Palm." : "Funds settle to your linked bank."}
        </Text>
      </View>

      <Card className="mt-8">
        <Text className="text-muted text-xs">Amount</Text>
        <View className="flex-row items-end">
          <Text className="text-display">$</Text>
          <Input placeholder="0" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        </View>
        <View className="flex-row gap-2 mt-3">
          {[100, 500, 1000].map((v) => (
            <Pressable key={v} onPress={() => setAmount(String(v))}
              className="bg-canvas-alt rounded-full px-3 py-1.5">
              <Text className="text-xs">${v}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {kycTier === "none" && (
        <Card tone="lime" className="mt-3">
          <Text className="text-ink">Verify your identity to continue.</Text>
          <Text className="text-ink/70 text-xs mt-1">Required by Palm for fiat rails.</Text>
        </Card>
      )}

      <View className="flex-1" />
      <Button onPress={next} disabled={!amount}>
        {kycTier === "none" ? "Verify identity" : "Continue"}
      </Button>
    </ScreenContainer>
  );
}
```

## Step 4 — Rail picker

`app/mint/rail.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { CreditCard, Building2, Globe2 } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMintStore, type Rail } from "@/stores/mintStore";

const RAILS: { key: Rail; label: string; sub: string; Icon: any; fee: string }[] = [
  { key: "card",  label: "Debit card",   sub: "Instant",                Icon: CreditCard, fee: "2.5%" },
  { key: "ach",   label: "ACH transfer", sub: "1–3 business days",      Icon: Building2,  fee: "0.5%" },
  { key: "wire",  label: "Wire",         sub: "Same day",               Icon: Globe2,     fee: "$15" },
  { key: "sepa",  label: "SEPA",         sub: "1 business day (EU)",    Icon: Globe2,     fee: "0.3%" },
];

export default function RailPicker() {
  const { rail, set } = useMintStore();

  return (
    <ScreenContainer>
      <Header title="Payment method" />
      <View className="gap-3 mt-4">
        {RAILS.map(({ key, label, sub, Icon, fee }) => (
          <Pressable key={key} onPress={() => set({ rail: key })}>
            <Card className={`flex-row items-center ${rail === key ? "border-2 border-lime" : ""}`}>
              <View className="w-12 h-12 rounded-2xl bg-canvas-alt items-center justify-center">
                <Icon size={20} color="#0E1410" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-body">{label}</Text>
                <Text className="text-muted text-xs">{sub}</Text>
              </View>
              <Text className="text-muted">{fee}</Text>
            </Card>
          </Pressable>
        ))}
      </View>
      <View className="flex-1" />
      <Button onPress={() => router.push("/mint/review")}>Continue</Button>
    </ScreenContainer>
  );
}
```

## Step 5 — Review + create intent

`app/mint/review.tsx`:
```tsx
import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { usePrivy } from "@privy-io/expo";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMintStore } from "@/stores/mintStore";
import { useWallet } from "@/hooks/useWallet";
import { createMintIntent } from "@/lib/api/mint";

export default function Review() {
  const { direction, amountFiat, rail, set } = useMintStore();
  const { address } = useWallet();
  const { getAccessToken } = usePrivy();
  const [loading, setLoading] = useState(false);

  const fiat = parseFloat(amountFiat || "0");
  const feePct = rail === "card" ? 0.025 : rail === "ach" ? 0.005 : 0;
  const feeFiat = rail === "wire" ? 15 : fiat * feePct;
  const net = fiat - feeFiat;

  const submit = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const token = await getAccessToken();
      const intent = await createMintIntent(token!, {
        walletAddress: address,
        amountFiat: fiat,
        currency: "USD",
        rail,
        direction,
      });
      set({ reference: intent.reference, status: "awaiting_payment", paymentInstructions: intent.paymentInstructions });
      router.replace("/mint/pay");
    } catch (e: any) {
      set({ status: "failed", error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Review" />
      <Card className="mt-4">
        <Row label="Amount" value={`$${fiat.toFixed(2)}`} />
        <Row label="Fee" value={`-$${feeFiat.toFixed(2)}`} />
        <View className="hairline my-2" />
        <Row label={direction === "mint" ? "You receive" : "You receive (USD)"} value={`${net.toFixed(2)} ${direction === "mint" ? "PUSD" : "USD"}`} bold />
        <View className="hairline my-2" />
        <Row label="Method" value={rail.toUpperCase()} />
      </Card>

      <Text className="text-muted text-xs mt-4 text-center">
        By continuing you accept Palm's terms. PUSD is fully reserved and non-freezable.
      </Text>

      <View className="flex-1" />
      <Button onPress={submit} loading={loading}>Confirm</Button>
    </ScreenContainer>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View className="flex-row justify-between py-2">
      <Text className="text-muted">{label}</Text>
      <Text className={bold ? "font-bold text-base" : ""}>{value}</Text>
    </View>
  );
}
```

## Step 6 — Pay screen (rail-specific instructions)

`app/mint/pay.tsx`:
```tsx
import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/expo";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useMintStore } from "@/stores/mintStore";
import { getMintIntent } from "@/lib/api/mint";

export default function Pay() {
  const { reference, rail, paymentInstructions, set } = useMintStore();
  const { getAccessToken } = usePrivy();

  const { data } = useQuery({
    queryKey: ["mint-intent", reference],
    queryFn: async () => {
      const token = await getAccessToken();
      return getMintIntent(token!, reference!);
    },
    enabled: !!reference,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (data?.status === "completed") {
      set({ status: "completed" });
      router.replace("/mint/success");
    }
    if (data?.status === "failed") {
      set({ status: "failed" });
    }
  }, [data?.status]);

  return (
    <ScreenContainer>
      <Header title="Complete payment" />
      <Card className="mt-4">
        {rail === "card" && (
          <Text className="text-body">Card payment widget here. Use Palm's hosted page or Stripe Elements via webview.</Text>
        )}
        {rail === "ach" && paymentInstructions && (
          <View className="gap-2">
            <Text className="text-h3">Send ACH to:</Text>
            <Text className="text-body">{(paymentInstructions as any).bankName}</Text>
            <Text className="text-body">Routing: {(paymentInstructions as any).routing}</Text>
            <Text className="text-body">Account: {(paymentInstructions as any).account}</Text>
            <Text className="text-body">Reference: {reference}</Text>
          </View>
        )}
        {rail === "wire" && paymentInstructions && (
          <Text className="text-body">Wire instructions shown here.</Text>
        )}
      </Card>

      <Card className="mt-3 flex-row items-center gap-3">
        <ActivityIndicator color="#0E1410" />
        <Text className="text-muted">Waiting for payment confirmation…</Text>
      </Card>

      <View className="flex-1" />
      <Button variant="ghost" onPress={() => router.dismissAll()}>I'll come back later</Button>
    </ScreenContainer>
  );
}
```

## Step 7 — Success

`app/mint/success.tsx`:
```tsx
import { View, Text } from "react-native";
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Button } from "@/components/ui/Button";
import { useMintStore } from "@/stores/mintStore";

export default function Success() {
  const { direction, amountFiat, reset } = useMintStore();

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-4">
        <View className="bg-lime rounded-full w-24 h-24 items-center justify-center">
          <Check size={48} color="#0E1410" strokeWidth={3} />
        </View>
        <Text className="text-h1">
          {direction === "mint" ? "PUSD added" : "Cash out started"}
        </Text>
        <Text className="text-muted text-center">
          {direction === "mint"
            ? `${amountFiat} PUSD will appear in your wallet shortly.`
            : `$${amountFiat} on its way to your bank.`}
        </Text>
      </View>
      <Button onPress={() => { reset(); router.dismissAll(); }}>Done</Button>
    </ScreenContainer>
  );
}
```

## Step 8 — Wire entry points

Add to Home `QuickActionBar` (spec 05): replace the "Bill" stub with "Get PUSD" routing to `/mint?direction=mint`. Add a "Cash out" entry under the "More" sheet routing to `/mint?direction=redeem`.

## Done when
- Backend mock returns instructions; UI shows them
- Polling flips status on the success screen when backend marks completed
- KYC gate blocks an unverified user and routes to `/(auth)/kyc`
- Insufficient PUSD balance for a redeem shows an inline error before submit
