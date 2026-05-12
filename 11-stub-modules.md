# 11 — Stub Modules

**Platform: web (Next.js 15 App Router).** See spec 01.

> Goal: ship themed shells for Gift Cards, Commerce, and Shopping. Real integrations are post-MVP, but the routes, layout, and visual language must be production-quality so the site feels complete on day one.

**Note:** Step body uses RN bottom-sheet (`@gorhom/bottom-sheet`) for a "More" mobile pattern; web replaces this with a Home page "More" section (grid of cards) and the same routes accessible from the sidebar nav and Profile page.

## Prereqs
- `01`–`05` (theme + nav)

## Acceptance criteria
- All three modules accessible from the Home page "More" section and from Profile
- Each renders a themed empty/coming-soon state instead of a broken page
- Mock data renders so the pages look populated in screenshots / public-facing demo
- Future-integration interfaces are sketched in `lib/api/` so swapping in real providers is mechanical
- Stub pages are public-route capable (no auth required to view) — useful for marketing previews

---

## Step 1 — Add a "More" sheet on Home

`components/wallet/MoreSheet.tsx`:
```tsx
import { forwardRef } from "react";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import {
  Gift, ShoppingBag, Store, ArrowDownToLine, ArrowUpFromLine, Receipt,
} from "lucide-react-native";

const ITEMS = [
  { key: "mint",      label: "Get PUSD",     Icon: ArrowDownToLine, route: "/mint?direction=mint" },
  { key: "redeem",    label: "Cash out",     Icon: ArrowUpFromLine, route: "/mint?direction=redeem" },
  { key: "giftcards", label: "Gift Cards",   Icon: Gift,            route: "/giftcards" },
  { key: "commerce",  label: "Marketplace",  Icon: Store,           route: "/commerce" },
  { key: "shopping",  label: "Shopping",     Icon: ShoppingBag,     route: "/shopping" },
  { key: "bills",     label: "Bills",        Icon: Receipt,         route: "/bills" },
];

export const MoreSheet = forwardRef<BottomSheet>((_, ref) => {
  return (
    <BottomSheet ref={ref} snapPoints={["50%"]} index={-1} enablePanDownToClose
                 backgroundStyle={{ backgroundColor: "#FBFFE8" }}>
      <BottomSheetView className="px-5 pt-2 pb-8">
        <Text className="text-h3 mb-4">More</Text>
        <View className="flex-row flex-wrap gap-3">
          {ITEMS.map(({ key, label, Icon, route }) => (
            <Pressable
              key={key}
              onPress={() => router.push(route as any)}
              className="bg-canvas-alt rounded-2xl p-4 items-center"
              style={{ width: "31%" }}
            >
              <View className="bg-lime rounded-xl w-12 h-12 items-center justify-center">
                <Icon size={20} color="#0E1410" />
              </View>
              <Text className="text-body mt-2 text-center text-xs">{label}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});
```

Wire into `app/(tabs)/index.tsx`: hold a ref, open the sheet when "More" QuickAction is pressed.

---

## Step 2 — Gift Cards stub

### Mock data
`lib/api/giftcards.ts`:
```ts
export interface Brand {
  id: string; name: string; category: string; image: string;
  denominations: number[]; supportedCurrencies: string[];
}

// Future: replace with Reloadly, Bitrefill, or Tango Card client
export async function fetchBrands(): Promise<Brand[]> {
  return MOCK_BRANDS;
}

const MOCK_BRANDS: Brand[] = [
  { id: "amazon", name: "Amazon", category: "shopping",
    image: "https://logo.clearbit.com/amazon.com",
    denominations: [25, 50, 100, 250], supportedCurrencies: ["USD"] },
  { id: "starbucks", name: "Starbucks", category: "food",
    image: "https://logo.clearbit.com/starbucks.com",
    denominations: [10, 25, 50], supportedCurrencies: ["USD"] },
  { id: "uber", name: "Uber", category: "travel",
    image: "https://logo.clearbit.com/uber.com",
    denominations: [25, 50, 100], supportedCurrencies: ["USD"] },
  { id: "netflix", name: "Netflix", category: "entertainment",
    image: "https://logo.clearbit.com/netflix.com",
    denominations: [30, 60], supportedCurrencies: ["USD"] },
  { id: "apple", name: "Apple", category: "shopping",
    image: "https://logo.clearbit.com/apple.com",
    denominations: [25, 50, 100, 200], supportedCurrencies: ["USD"] },
  { id: "spotify", name: "Spotify", category: "entertainment",
    image: "https://logo.clearbit.com/spotify.com",
    denominations: [30, 60, 99], supportedCurrencies: ["USD"] },
];

export const CATEGORIES = ["all", "shopping", "food", "travel", "entertainment"];
```

### `app/giftcards/index.tsx`
```tsx
import { useState } from "react";
import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { fetchBrands, CATEGORIES } from "@/lib/api/giftcards";

export default function GiftCards() {
  const [cat, setCat] = useState("all");
  const { data: brands = [] } = useQuery({ queryKey: ["giftcard-brands"], queryFn: fetchBrands });
  const filtered = cat === "all" ? brands : brands.filter((b) => b.category === cat);

  return (
    <ScreenContainer padded={false}>
      <View className="px-5"><Header title="Gift Cards" /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Card tone="lime">
          <Text className="text-h3">Spend PUSD anywhere</Text>
          <Text className="text-ink/70 text-xs mt-1">Buy gift cards from 100+ brands.</Text>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4">
          <View className="flex-row gap-2">
            {CATEGORIES.map((c) => (
              <Pill key={c} active={cat === c} onPress={() => setCat(c)}>{c}</Pill>
            ))}
          </View>
        </ScrollView>

        <View className="flex-row flex-wrap gap-3 mt-4">
          {filtered.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => router.push({ pathname: "/giftcards/checkout", params: { brandId: b.id } })}
              style={{ width: "48%" }}
            >
              <Card>
                <Image source={{ uri: b.image }} style={{ width: 48, height: 48, borderRadius: 12 }} />
                <Text className="text-body mt-3">{b.name}</Text>
                <Text className="text-muted text-xs">From ${Math.min(...b.denominations)}</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
```

### `app/giftcards/checkout.tsx`
```tsx
import { useState } from "react";
import { View, Text, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { fetchBrands } from "@/lib/api/giftcards";

export default function Checkout() {
  const { brandId } = useLocalSearchParams<{ brandId: string }>();
  const { data: brands = [] } = useQuery({ queryKey: ["giftcard-brands"], queryFn: fetchBrands });
  const brand = brands.find((b) => b.id === brandId);
  const [denom, setDenom] = useState<number>();
  const [email, setEmail] = useState("");

  if (!brand) return null;

  return (
    <ScreenContainer>
      <Header title={brand.name} />
      <Card className="mt-4 flex-row items-center">
        <Image source={{ uri: brand.image }} style={{ width: 56, height: 56, borderRadius: 14 }} />
        <View className="ml-3 flex-1">
          <Text className="text-h3">{brand.name}</Text>
          <Text className="text-muted text-xs capitalize">{brand.category}</Text>
        </View>
      </Card>

      <Text className="text-h3 mt-6 mb-2">Choose amount</Text>
      <View className="flex-row flex-wrap gap-2">
        {brand.denominations.map((d) => (
          <Pill key={d} active={denom === d} onPress={() => setDenom(d)}>${d}</Pill>
        ))}
      </View>

      <View className="mt-6">
        <Input label="Recipient email" placeholder="them@example.com" autoCapitalize="none"
               keyboardType="email-address" value={email} onChangeText={setEmail} />
      </View>

      <View className="flex-1" />
      <Card tone="cream">
        <Text className="text-muted text-xs">Coming soon</Text>
        <Text className="text-body mt-1">
          Gift card purchases launching with {/* TODO: provider name */}.
        </Text>
      </Card>
      <Button disabled>Pay {denom ? `$${denom}` : ""} PUSD</Button>
    </ScreenContainer>
  );
}
```

> **Future integration:** swap `lib/api/giftcards.ts` for a Reloadly / Bitrefill / Tango Card client. Backend (spec 12) holds the API key and proxies orders.

---

## Step 3 — Commerce / Marketplace stub

### Mock data
`lib/api/commerce.ts`:
```ts
export interface Merchant {
  id: string; name: string; category: string; cover: string; rating: number;
  acceptsPusd: boolean; description: string;
}

export async function fetchMerchants(): Promise<Merchant[]> {
  return MOCK;
}

const MOCK: Merchant[] = [
  { id: "blue-bottle", name: "Blue Bottle Coffee", category: "food", cover: "",
    rating: 4.7, acceptsPusd: true, description: "Specialty coffee, pay-on-pickup with PUSD." },
  { id: "rains", name: "Rains", category: "fashion", cover: "",
    rating: 4.5, acceptsPusd: true, description: "Waterproof outerwear from Copenhagen." },
  { id: "outdoor-voices", name: "Outdoor Voices", category: "fashion", cover: "",
    rating: 4.3, acceptsPusd: true, description: "Recreational apparel." },
  { id: "muji", name: "MUJI", category: "home", cover: "",
    rating: 4.6, acceptsPusd: false, description: "Minimalist home goods (PUSD coming soon)." },
];
```

### `app/commerce/index.tsx`
```tsx
import { ScrollView, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { fetchMerchants } from "@/lib/api/commerce";

export default function Commerce() {
  const { data = [] } = useQuery({ queryKey: ["merchants"], queryFn: fetchMerchants });

  return (
    <ScreenContainer padded={false}>
      <View className="px-5"><Header title="Marketplace" /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Card tone="dark">
          <Text className="text-inverse/60 text-xs">Featured</Text>
          <Text className="text-h2 text-inverse">Spend PUSD with merchants near you</Text>
          <Text className="text-inverse/70 text-xs mt-2">Solana Pay integration shipping next.</Text>
        </Card>

        <View className="gap-3 mt-4">
          {data.map((m) => (
            <Pressable key={m.id} onPress={() => router.push({ pathname: "/commerce/merchant/[id]", params: { id: m.id } })}>
              <Card>
                <View className="flex-row justify-between">
                  <Text className="text-h3">{m.name}</Text>
                  <View className="flex-row items-center gap-1">
                    <Star size={14} color="#0E1410" fill="#C8F560" />
                    <Text className="text-xs">{m.rating}</Text>
                  </View>
                </View>
                <Text className="text-muted text-xs mt-1 capitalize">{m.category}</Text>
                <Text className="text-body mt-2">{m.description}</Text>
                {m.acceptsPusd && (
                  <View className="bg-lime self-start rounded-full px-2 py-1 mt-3">
                    <Text className="text-ink text-[10px] font-semi">Accepts PUSD</Text>
                  </View>
                )}
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
```

### `app/commerce/merchant/[id].tsx`
```tsx
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { fetchMerchants } from "@/lib/api/commerce";

export default function Merchant() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data = [] } = useQuery({ queryKey: ["merchants"], queryFn: fetchMerchants });
  const m = data.find((x) => x.id === id);
  if (!m) return null;

  return (
    <ScreenContainer>
      <Header title={m.name} />
      <Card className="mt-3">
        <Text className="text-h3">{m.name}</Text>
        <Text className="text-muted text-xs capitalize mt-1">{m.category}</Text>
        <Text className="text-body mt-3">{m.description}</Text>
      </Card>
      <Card className="mt-3">
        <Text className="text-muted text-xs">Coming soon</Text>
        <Text className="text-body mt-1">
          Solana Pay invoicing and merchant onboarding launch in v2.
        </Text>
      </Card>
      <View className="flex-1" />
      <Button disabled>Pay with PUSD</Button>
    </ScreenContainer>
  );
}
```

> **Future integration:** Solana Pay specification — generate `solana:` URIs with a reference pubkey. Each merchant gets a wallet; we listen for confirmed transfers tagged with the reference.

---

## Step 4 — Shopping stub

### `app/shopping/index.tsx`
```tsx
import { ScrollView, View, Text, Pressable, Image } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";

const STORES = [
  { id: "newegg", name: "Newegg", url: "https://newegg.com", image: "https://logo.clearbit.com/newegg.com" },
  { id: "shopify", name: "Shopify Crypto Stores", url: "https://shopify.com", image: "https://logo.clearbit.com/shopify.com" },
  { id: "travala", name: "Travala", url: "https://travala.com", image: "https://logo.clearbit.com/travala.com" },
];

export default function Shopping() {
  return (
    <ScreenContainer padded={false}>
      <View className="px-5"><Header title="Shopping" /></View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Card tone="lime">
          <Text className="text-h3">Curated stores accepting PUSD</Text>
          <Text className="text-ink/70 text-xs mt-1">Tap to open in browser.</Text>
        </Card>

        <Pressable onPress={() => router.push("/shopping/orders")} className="mt-3">
          <Card className="flex-row justify-between items-center">
            <Text className="text-body">My orders</Text>
            <Text className="text-muted">›</Text>
          </Card>
        </Pressable>

        <View className="flex-row flex-wrap gap-3 mt-3">
          {STORES.map((s) => (
            <Pressable key={s.id} style={{ width: "48%" }}>
              <Card>
                <Image source={{ uri: s.image }} style={{ width: 48, height: 48, borderRadius: 12 }} />
                <Text className="text-body mt-3">{s.name}</Text>
                <Text className="text-muted text-xs">External</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
```

### `app/shopping/orders.tsx`
```tsx
import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";

export default function Orders() {
  return (
    <ScreenContainer>
      <Header title="My orders" />
      <Card className="mt-4">
        <Text className="text-muted">No orders yet.</Text>
        <Text className="text-muted text-xs mt-1">
          Orders placed through linked stores will appear here.
        </Text>
      </Card>
    </ScreenContainer>
  );
}
```

---

## Step 5 — Stub routes for "Bills" and any other empties

`app/bills.tsx`:
```tsx
import { View, Text } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";

export default function Bills() {
  return (
    <ScreenContainer>
      <Header title="Bills" />
      <Card tone="lime" className="mt-4">
        <Text className="text-h3">Pay utilities with PUSD</Text>
        <Text className="text-ink/70 text-xs mt-1">Electricity, internet, mobile, more.</Text>
      </Card>
      <Card className="mt-3">
        <Text className="text-muted">Coming soon — pilot launching with select biller partners.</Text>
      </Card>
    </ScreenContainer>
  );
}
```

---

## Step 6 — Profile screen

`app/(tabs)/profile.tsx`:
```tsx
import { ScrollView, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { usePrivy } from "@privy-io/expo";
import { Shield, Smartphone, BadgeCheck, Info, LogOut, Copy } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useWallet } from "@/hooks/useWallet";
import { useUserStore } from "@/stores/userStore";
import { shortAddr } from "@/lib/utils/format";

const SECTIONS = [
  { key: "kyc",      label: "Identity verification", Icon: BadgeCheck, route: "/settings/kyc-status" },
  { key: "security", label: "Security",              Icon: Shield,     route: "/settings/security" },
  { key: "devices",  label: "Devices",               Icon: Smartphone, route: "/settings/devices" },
  { key: "about",    label: "About Oasis",           Icon: Info,       route: "/settings/about" },
];

export default function Profile() {
  const { user, logout } = usePrivy();
  const { address } = useWallet();
  const reset = useUserStore((s) => s.reset);
  const email = user?.linked_accounts.find((a: any) => a.type === "email")?.address ?? "";

  const onLogout = async () => { await logout(); reset(); router.replace("/(auth)/onboarding"); };

  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 16 }}>
        <View className="items-center gap-2">
          <Avatar name={email || "User"} size={96} />
          <Text className="text-h3 mt-2">{email}</Text>
        </View>

        {address && (
          <Card className="mt-6 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-muted text-xs">Wallet address</Text>
              <Text className="text-body">{shortAddr(address, 8, 8)}</Text>
            </View>
            <Pressable onPress={() => Clipboard.setStringAsync(address)}>
              <Copy size={18} color="#0E1410" />
            </Pressable>
          </Card>
        )}

        <View className="gap-2 mt-3">
          {SECTIONS.map(({ key, label, Icon, route }) => (
            <Pressable key={key} onPress={() => router.push(route as any)}>
              <Card className="flex-row items-center">
                <View className="w-10 h-10 rounded-2xl bg-canvas-alt items-center justify-center">
                  <Icon size={18} color="#0E1410" />
                </View>
                <Text className="text-body flex-1 ml-3">{label}</Text>
                <Text className="text-muted">›</Text>
              </Card>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={onLogout} className="mt-6 flex-row items-center justify-center gap-2 py-4">
          <LogOut size={18} color="#E5484D" />
          <Text className="text-danger font-semi">Sign out</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
```

`app/settings/security.tsx`, `app/settings/devices.tsx`, `app/settings/kyc-status.tsx`, `app/settings/about.tsx`: same shell pattern as `bills.tsx`. Each renders `<Header />` + a few `<Card />` rows. Skip detailed implementation for MVP.

---

## Done when
- Tapping each stub module opens a themed screen with mock content (not a blank screen)
- Disabled "Pay with PUSD" buttons clearly indicate what's coming next
- Logout works end-to-end (returns to onboarding)
- App icon → screenshot of any of these modules looks credible for a store listing
