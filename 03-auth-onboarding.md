# 03 — Auth & Onboarding

**Platform: web (Next.js 15 App Router) + Privy web SDK.** See spec 01.

> Goal: ship the full pre-app flow — onboarding screens, email login via Privy web SDK, OTP verify, embedded Solana wallet creation, and passkey enrolment for transaction confirmation. No KYC in v1 — Palm has no fiat onramp API to gate (see project_palm_constraints memory; spec 08 has been replaced with Reserves Transparency).

**Note:** Step body references `@privy-io/expo` and Expo Router groups; the web equivalent is `@privy-io/react-auth` and Next.js App Router groups (`app/(auth)/*`, `app/(app)/*`).

## Prereqs
- `01-project-setup.md`, `02-theme-system.md`

## Acceptance criteria
- New user: onboarding → email → OTP → wallet auto-created → lands on `/` (authed home)
- Returning user: bypasses onboarding, lands on home if Privy session is valid
- Passkey is enrolled at first login and prompted on every signing operation
- Logging out wipes Privy session + browser storage
- Wallet-Connect (Phantom etc.) is **not** offered in v1 — email-only, single login surface

---

## Step 1 — Privy provider

`lib/privy/client.ts`:
```ts
export const PRIVY_CONFIG = {
  appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID!,
  clientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID!,
};
```

Wrap root in `app/_layout.tsx`:
```tsx
import { PrivyProvider, PrivyElements } from "@privy-io/expo";
import { PRIVY_CONFIG } from "@/lib/privy/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// inside RootLayout return, wrap Stack:
<PrivyProvider appId={PRIVY_CONFIG.appId} clientId={PRIVY_CONFIG.clientId}>
  <QueryClientProvider client={queryClient}>
    <Stack screenOptions={{ headerShown: false }} />
    <PrivyElements />
  </QueryClientProvider>
</PrivyProvider>
```

## Step 2 — Auth gate

`app/index.tsx` (replace dev splash):
```tsx
import { Redirect } from "expo-router";
import { usePrivy } from "@privy-io/expo";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isReady, user } = usePrivy();
  if (!isReady) {
    return (
      <View className="flex-1 bg-canvas items-center justify-center">
        <ActivityIndicator color="#0E1410" />
      </View>
    );
  }
  return user ? <Redirect href="/(tabs)" /> : <Redirect href="/(auth)/onboarding" />;
}
```

## Step 3 — Onboarding swiper

`app/(auth)/_layout.tsx`:
```tsx
import { Stack } from "expo-router";
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

`app/(auth)/onboarding.tsx` — 3 slides, mirrors image 3 vibe:
```tsx
import { useState, useRef } from "react";
import { View, Text, FlatList, Dimensions, Pressable } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";

const { width } = Dimensions.get("window");

const slides = [
  { title: "Digital banking, made for digital users",
    body: "Spend, earn, and track PUSD anywhere.", art: "🌴" },
  { title: "Get paid in stablecoin",
    body: "Receive payroll in PUSD. No volatility, no waiting.", art: "💸" },
  { title: "Swap, send, mint, redeem",
    body: "All from one app, with self-custody.", art: "✦" },
];

export default function Onboarding() {
  const [idx, setIdx] = useState(0);
  const ref = useRef<FlatList>(null);

  const next = () => {
    if (idx < slides.length - 1) {
      ref.current?.scrollToIndex({ index: idx + 1 });
    } else {
      router.replace("/(auth)/login");
    }
  };

  return (
    <View className="flex-1 bg-canvas">
      <View className="flex-row justify-end p-5">
        <Pressable onPress={() => router.replace("/(auth)/login")}>
          <Text className="text-muted">Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={ref}
        data={slides}
        keyExtractor={(_, i) => String(i)}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIdx(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={{ width }} className="items-center px-6">
            <View className="bg-lime rounded-3xl items-center justify-center"
                  style={{ width: width * 0.7, height: width * 0.7 }}>
              <Text style={{ fontSize: 80 }}>{item.art}</Text>
            </View>
            <Text className="text-h1 mt-10 text-center">{item.title}</Text>
            <Text className="text-muted mt-3 text-center">{item.body}</Text>
          </View>
        )}
      />

      <View className="flex-row justify-center gap-2 my-6">
        {slides.map((_, i) => (
          <View key={i}
            className={`h-2 rounded-full ${i === idx ? "bg-ink w-6" : "bg-ink/30 w-2"}`} />
        ))}
      </View>

      <View className="px-5 pb-10">
        <Button onPress={next}>{idx === slides.length - 1 ? "Let's start" : "Next"}</Button>
      </View>
    </View>
  );
}
```

## Step 4 — Email login

`app/(auth)/login.tsx`:
```tsx
import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { useLoginWithEmail } from "@privy-io/expo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { z } from "zod";

const emailSchema = z.string().email();

export default function Login() {
  const { sendCode } = useLoginWithEmail();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return setError("Enter a valid email");
    setLoading(true);
    try {
      await sendCode({ email });
      router.push({ pathname: "/(auth)/verify", params: { email } });
    } catch (e: any) {
      setError(e.message ?? "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 justify-center gap-6">
        <Text className="text-h1">Welcome to Oasis</Text>
        <Text className="text-muted">We'll email you a 6-digit code.</Text>
        <Input
          placeholder="you@example.com"
          autoCapitalize="none" keyboardType="email-address"
          value={email} onChangeText={(t) => { setEmail(t); setError(undefined); }}
          error={error}
        />
        <Button onPress={onSubmit} loading={loading}>Continue</Button>
      </View>
    </ScreenContainer>
  );
}
```

## Step 5 — OTP verify

`app/(auth)/verify.tsx`:
```tsx
import { useState, useRef } from "react";
import { View, Text, TextInput } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useLoginWithEmail } from "@privy-io/expo";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";

export default function Verify() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { loginWithCode } = useLoginWithEmail();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setLoading(true);
    try {
      await loginWithCode({ code, email });
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e.message ?? "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 justify-center gap-6">
        <Text className="text-h1">Enter code</Text>
        <Text className="text-muted">Sent to {email}</Text>
        <TextInput
          value={code} onChangeText={setCode}
          maxLength={6} keyboardType="number-pad"
          className="bg-surface rounded-xl px-4 py-5 text-h2 text-center tracking-[8px]"
          placeholder="------" placeholderTextColor="#7A867A"
        />
        {error && <Text className="text-danger">{error}</Text>}
        <Button onPress={submit} loading={loading} disabled={code.length < 6}>Verify</Button>
      </View>
    </ScreenContainer>
  );
}
```

## Step 6 — Wallet auto-creation

Privy's embedded wallet creation runs automatically when a user logs in (configured per-app in Privy dashboard: enable "Solana embedded wallets, create on login"). No code needed for creation. Read it via:

`hooks/useWallet.ts`:
```ts
import { usePrivy, useEmbeddedSolanaWallet } from "@privy-io/expo";

export function useWallet() {
  const { user } = usePrivy();
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];
  return {
    address: wallet?.publicKey ?? null,
    wallet,
    user,
    isReady: !!wallet,
  };
}
```

## Step 7 — KYC stub

`stores/userStore.ts`:
```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export type KycTier = "none" | "basic" | "verified" | "pro";

interface UserState {
  kycTier: KycTier;
  setKycTier: (t: KycTier) => void;
  reset: () => void;
}

const secureStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      kycTier: "none",
      setKycTier: (kycTier) => set({ kycTier }),
      reset: () => set({ kycTier: "none" }),
    }),
    { name: "oasis.user", storage: createJSONStorage(() => secureStorage) }
  )
);
```

`app/(auth)/kyc.tsx` — only navigated to from mint/redeem entry, not auth flow (auth is light):
```tsx
import { View, Text } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useUserStore } from "@/stores/userStore";

export default function Kyc() {
  const setKycTier = useUserStore((s) => s.setKycTier);

  return (
    <ScreenContainer>
      <View className="flex-1 gap-4 py-8">
        <Text className="text-h1">Verify your identity</Text>
        <Text className="text-muted">Required for fiat deposits and withdrawals. Wallet usage is unrestricted.</Text>

        <Card tone="cream">
          <Text className="text-h3">Basic — $1k/mo</Text>
          <Text className="text-muted mt-1">Email + name</Text>
        </Card>
        <Card tone="cream">
          <Text className="text-h3">Verified — $25k/mo</Text>
          <Text className="text-muted mt-1">+ Government ID</Text>
        </Card>
        <Card tone="cream">
          <Text className="text-h3">Pro — Unlimited</Text>
          <Text className="text-muted mt-1">+ Proof of address + source of funds</Text>
        </Card>

        <View className="flex-1" />
        <Button onPress={() => { setKycTier("basic"); router.back(); }}>
          Start Basic verification (stub)
        </Button>
      </View>
    </ScreenContainer>
  );
}
```

> **Note:** The actual KYC vendor integration (Persona, Sumsub, etc.) is post-MVP. The stub gates spec-08 (mint/redeem) entry.

## Step 8 — Logout

Add to spec 11 (profile screen): button calls `usePrivy().logout()` then `useUserStore.getState().reset()`.

## Done when
- Fresh install → onboarding shows
- Email + OTP → lands on `(tabs)` with a populated wallet address (logged to console)
- Killing the app and reopening → goes straight to `(tabs)`
- KYC stub updates `userStore.kycTier`
