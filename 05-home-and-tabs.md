# 05 — Home & Navigation

**Platform: web (Next.js 15 App Router).** See spec 01. *(File is named `05-home-and-tabs.md` for backwards reference; the spec is now Home & Navigation — there are no tabs on web.)*

> Goal: ship the main authenticated shell — a responsive sidebar (≥md) that collapses to a top bar with hamburger on mobile, lime pill highlight on the active route, and the Home page (Visa-style balance card, quick actions, quick send, recent activity). Reference image 2 still applies for the Home page; tab-bar visuals are obsolete.

**Note:** Step body builds a React Native bottom tab bar; the web shell is a sidebar `<nav>` with `usePathname()` for active highlight, rendered inside `app/(app)/layout.tsx`.

## Prereqs
- `01`, `02`, `03`, `04`

## Acceptance criteria
- 5 nav routes: Home (`/`), Stats (`/stats`), Swap (`/swap`), Payroll (`/payroll`), Profile (`/profile`)
- Sidebar visible at `≥md` breakpoint with lime pill highlight on active link; collapses to top bar with hamburger menu below `md`
- Home shows real PUSD balance + recent transactions
- Clicking Send → opens send dialog (spec 07); Receive opens a dialog with QR
- Layout is keyboard-accessible (focus rings, skip-to-content link)

---

## Step 1 — Tabs layout

`app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from "expo-router";
import { Home, BarChart2, ArrowLeftRight, Users, User } from "lucide-react-native";
import { CustomTabBar } from "@/components/nav/TabBar";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"     options={{ title: "Home", tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="statistics" options={{ title: "Stats", tabBarIcon: ({ color }) => <BarChart2 color={color} size={22} /> }} />
      <Tabs.Screen name="swap"      options={{ title: "Swap", tabBarIcon: ({ color }) => <ArrowLeftRight color={color} size={22} /> }} />
      <Tabs.Screen name="payroll"   options={{ title: "Payroll", tabBarIcon: ({ color }) => <Users color={color} size={22} /> }} />
      <Tabs.Screen name="profile"   options={{ title: "Profile", tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
    </Tabs>
  );
}
```

## Step 2 — Custom tab bar

`components/nav/TabBar.tsx`:
```tsx
import { View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useEffect } from "react";

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const tabWidth = 60;
  const slide = useSharedValue(0);

  useEffect(() => {
    slide.value = withSpring(state.index * tabWidth, { damping: 18, stiffness: 220 });
  }, [state.index]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slide.value }],
  }));

  return (
    <View style={{ paddingBottom: insets.bottom + 16, alignItems: "center" }}>
      <View className="bg-ink rounded-full px-3 py-2 flex-row relative">
        <Animated.View
          style={[pillStyle, { position: "absolute", top: 8, left: 12, width: 44, height: 44 }]}
          className="bg-lime rounded-full"
        />
        {state.routes.map((route, idx) => {
          const focused = state.index === idx;
          const { options } = descriptors[route.key];
          const onPress = () => navigation.navigate(route.name);
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{ width: tabWidth, height: 44 }}
              className="items-center justify-center"
            >
              {options.tabBarIcon?.({
                focused, color: focused ? "#0E1410" : "#F5FFE0", size: 22,
              })}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
```

> The animated pill width above (44) plus tabWidth (60) gives ~16px gap. Tweak `left: 12` if visual alignment is off.

## Step 3 — Home screen

`app/(tabs)/index.tsx`:
```tsx
import { ScrollView, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Avatar } from "@/components/ui/Avatar";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { QuickActionBar } from "@/components/wallet/QuickActionBar";
import { QuickSendList } from "@/components/wallet/QuickSendList";
import { RecentActivity } from "@/components/wallet/RecentActivity";

export default function Home() {
  return (
    <ScreenContainer padded={false}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between py-3">
          <View className="flex-row items-center gap-3">
            <Avatar name="William Current" size={44} />
            <View>
              <Text className="text-muted text-xs">William Current</Text>
              <Text className="text-h3">Welcome Back 👋</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push("/notifications")}
            className="bg-surface rounded-full w-11 h-11 items-center justify-center"
          >
            <Bell size={20} color="#0E1410" />
          </Pressable>
        </View>

        <BalanceCard />
        <View className="h-5" />
        <QuickActionBar />

        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-h3">Quick Send</Text>
            <Pressable onPress={() => router.push("/send")}>
              <Text className="text-muted">See all ›</Text>
            </Pressable>
          </View>
          <QuickSendList />
        </View>

        <View className="mt-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-h3">Recent Activity</Text>
            <Pressable onPress={() => router.push("/activity")}>
              <Text className="text-muted">See all ›</Text>
            </Pressable>
          </View>
          <RecentActivity />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
```

## Step 4 — Balance card

`components/wallet/BalanceCard.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Wifi } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { usePusdBalance } from "@/hooks/usePusdBalance";
import { useWallet } from "@/hooks/useWallet";
import { shortAddr } from "@/lib/utils/format";
import { router } from "expo-router";

function Sparkle() {
  return (
    <Svg width={36} height={36} viewBox="0 0 24 24" fill="#C8F560">
      <Path d="M12 2 L13.5 9 L20 10.5 L13.5 12 L12 20 L10.5 12 L4 10.5 L10.5 9 Z" />
    </Svg>
  );
}

export function BalanceCard() {
  const { data, isLoading } = usePusdBalance();
  const { address } = useWallet();
  const last4 = address ? address.slice(-4) : "•••• ";

  return (
    <Card tone="dark" className="overflow-hidden">
      <View className="flex-row justify-between items-start">
        <Text className="text-inverse/80 font-bold tracking-widest text-base">VISA</Text>
        <Pressable
          onPress={() => router.push("/budget")}
          className="bg-lime/20 rounded-full px-3 py-1.5"
        >
          <Text className="text-lime text-xs font-semi">Set Budget</Text>
        </Pressable>
      </View>

      <View className="absolute top-3 right-20"><Sparkle /></View>

      <Text className="text-inverse/60 mt-6 text-xs">Balance</Text>
      <Text className="text-inverse text-[36px] font-bold">
        {isLoading ? "—" : `$${data?.formatted ?? "0.00"}`}
      </Text>

      <Text className="text-inverse/60 mt-3 tracking-widest">
        •••• •••• •••• {last4}
      </Text>

      <View className="flex-row justify-between items-center mt-4">
        <Text className="text-inverse/80 text-xs">{address ? shortAddr(address) : ""}</Text>
        <View className="flex-row items-center gap-3">
          <Text className="text-inverse/60 text-xs">Exp 07/26</Text>
          <View className="bg-lime rounded-xl px-3 py-2">
            <Wifi size={18} color="#0E1410" />
          </View>
        </View>
      </View>
    </Card>
  );
}
```

## Step 5 — Quick actions

`components/wallet/QuickActionBar.tsx`:
```tsx
import { View, Pressable, Text } from "react-native";
import { Send, FileText, Smartphone, MoreHorizontal } from "lucide-react-native";
import { router } from "expo-router";

const ACTIONS = [
  { key: "send", label: "Send", icon: Send, onPress: () => router.push("/send") },
  { key: "bill", label: "Bill", icon: FileText, onPress: () => {} },
  { key: "mobile", label: "Mobile", icon: Smartphone, onPress: () => {} },
  { key: "more", label: "More", icon: MoreHorizontal, onPress: () => {}, active: true },
];

export function QuickActionBar() {
  return (
    <View className="flex-row justify-between">
      {ACTIONS.map(({ key, label, icon: Icon, onPress, active }) => (
        <Pressable key={key} onPress={onPress} className="items-center" style={{ flex: 1 }}>
          <View className={`w-14 h-14 rounded-2xl items-center justify-center ${active ? "bg-lime" : "bg-surface"}`}>
            <Icon size={22} color="#0E1410" />
          </View>
          <Text className="text-muted text-xs mt-1.5">{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

## Step 6 — Quick send

`components/wallet/QuickSendList.tsx`:
```tsx
import { ScrollView, Pressable, View, Text } from "react-native";
import { router } from "expo-router";
import { Avatar } from "@/components/ui/Avatar";

const MOCK = [
  { name: "Azie", uri: undefined },
  { name: "Chasir", uri: undefined },
  { name: "Fandit", uri: undefined },
  { name: "Happy", uri: undefined },
  { name: "Nayu", uri: undefined },
];

export function QuickSendList() {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-4">
        {MOCK.map((c) => (
          <Pressable
            key={c.name}
            onPress={() => router.push({ pathname: "/send/amount", params: { recipient: c.name } })}
            className="items-center"
            style={{ width: 64 }}
          >
            <Avatar name={c.name} size={56} />
            <Text className="text-muted text-xs mt-2">{c.name}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
```

> Hook this up to a real `useContacts()` from the backend (spec 12) once that's ready.

## Step 7 — Recent activity

`components/wallet/RecentActivity.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react-native";
import { router } from "expo-router";
import { useTransactions } from "@/hooks/useTransactions";
import { formatRaw } from "@/lib/chains/solana";
import { relTime, shortAddr } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";

export function RecentActivity() {
  const { data, isLoading } = useTransactions(5);

  if (isLoading) {
    return <Card><Text className="text-muted">Loading…</Text></Card>;
  }
  if (!data || data.length === 0) {
    return (
      <Card>
        <Text className="text-muted">No PUSD activity yet.</Text>
      </Card>
    );
  }

  return (
    <View className="gap-2">
      {data.map((tx) => {
        const isOut = tx.direction === "out";
        const Icon = isOut ? ArrowUpRight : ArrowDownLeft;
        const counterparty = isOut ? tx.to : tx.from;
        return (
          <Pressable
            key={tx.hash}
            onPress={() => router.push({ pathname: "/transaction/[id]", params: { id: tx.hash } })}
          >
            <Card className="flex-row items-center" tone="cream">
              <View className="w-10 h-10 rounded-full bg-ink items-center justify-center">
                <Icon size={18} color="#F5FFE0" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-body">{shortAddr(counterparty)}</Text>
                <Text className="text-muted text-xs">{relTime(tx.timestamp)}</Text>
              </View>
              <Text className={isOut ? "text-danger font-semi" : "text-success font-semi"}>
                {isOut ? "-" : "+"}${formatRaw(tx.amount)}
              </Text>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
```

## Step 8 — Notifications + Activity stub routes

`app/notifications.tsx`:
```tsx
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Text } from "react-native";

export default function Notifications() {
  return (
    <ScreenContainer>
      <Header title="Notifications" />
      <Text className="text-muted mt-6">Inbox empty.</Text>
    </ScreenContainer>
  );
}
```

`app/activity.tsx`: full transaction list using `useTransactions(50)` rendered with FlashList. (Same row as RecentActivity, just unbounded.)

## Step 9 — Header component

`components/nav/Header.tsx`:
```tsx
import { View, Text, Pressable } from "react-native";
import { ArrowLeft, MoreHorizontal } from "lucide-react-native";
import { router } from "expo-router";
import { ReactNode } from "react";

export function Header({
  title, action, hideBack,
}: { title: string; action?: ReactNode; hideBack?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-3">
      {hideBack ? <View style={{ width: 40 }} /> : (
        <Pressable
          onPress={() => router.back()}
          className="bg-surface rounded-full w-10 h-10 items-center justify-center"
        >
          <ArrowLeft size={20} color="#0E1410" />
        </Pressable>
      )}
      <Text className="text-h3">{title}</Text>
      {action ?? (
        <Pressable className="bg-surface rounded-full w-10 h-10 items-center justify-center">
          <MoreHorizontal size={20} color="#0E1410" />
        </Pressable>
      )}
    </View>
  );
}
```

## Done when
- Tab bar pill animates between tabs
- Home shows your real PUSD balance after login
- Recent activity lists actual on-chain PUSD transfers
- Quick action "Send" opens the send flow (will be a stub until spec 07)
