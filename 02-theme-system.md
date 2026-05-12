# 02 — Theme System

**Platform: web (Next.js 15 App Router).** See spec 01.

> Goal: install the Oasis design language so every component composes from the same Tailwind tokens (colors, spacing, radii, typography). UI primitives are composed from shadcn/ui — no custom design system from scratch.

**Note:** Step body references NativeWind and RN components; headers/AC are authoritative for the web rewrite.

## Prereqs
- `01-project-setup.md` complete

## Acceptance criteria
- `bg-canvas`, `bg-lime`, `text-ink`, `text-muted` Tailwind classes render correctly on a test page
- Plus Jakarta Sans loads via `next/font` with no FOUT
- All UI primitives (`Button`, `Card`, `Input`, `Pill`, `Avatar`) exist (composed from shadcn) and are preview-able via a `/dev` route
- Tokens live in `theme/tokens.ts` and are referenced by `tailwind.config.ts` — no duplication

---

## Step 1 — Tokens

`theme/tokens.ts`:
```ts
export const colors = {
  canvas:       "#EFF6D8",
  canvasAlt:    "#E6F0C2",
  surface:      "#FBFFE8",
  surfaceWhite: "#FFFFFF",
  ink:          "#0E1410",

  lime:         "#C8F560",
  limeStrong:   "#B4E84A",
  limeSoft:     "#DEF59A",

  cyan:         "#5DC9C1",
  cyanGlow:     "#8DE0DA",

  text:         "#1A1F1A",
  textMuted:    "#7A867A",
  textInverse:  "#F5FFE0",
  textOnLime:   "#0E1410",

  success:      "#5BBF6A",
  danger:       "#E5484D",
  warning:      "#F0B429",

  hairline:     "rgba(14,20,16,0.08)",
  hairlineDark: "rgba(245,255,224,0.12)",
} as const;

export const radius = {
  none: 0, sm: 8, md: 14, lg: 20, xl: 24, "2xl": 32, pill: 999,
} as const;

export const spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20,
  6: 24, 7: 28, 8: 32, 10: 40, 12: 48, 14: 56, 16: 64, 20: 80,
} as const;

export const shadow = {
  card: { shadowColor: "#0E1410", shadowOpacity: 0.06, shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  hero: { shadowColor: "#0E1410", shadowOpacity: 0.18, shadowRadius: 28,
          shadowOffset: { width: 0, height: 14 }, elevation: 8 },
} as const;
```

## Step 2 — `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas:       "#EFF6D8",
        "canvas-alt": "#E6F0C2",
        surface:      "#FBFFE8",
        ink:          "#0E1410",
        lime:         { DEFAULT: "#C8F560", strong: "#B4E84A", soft: "#DEF59A" },
        cyan:         { DEFAULT: "#5DC9C1", glow: "#8DE0DA" },
        muted:        "#7A867A",
        inverse:      "#F5FFE0",
        hairline:     "rgba(14,20,16,0.08)",
        success:      "#5BBF6A",
        danger:       "#E5484D",
        warning:      "#F0B429",
      },
      borderRadius: { xl: "20px", "2xl": "24px", "3xl": "32px" },
      fontFamily: {
        sans:   ["PlusJakartaSans_500Medium"],
        medium: ["PlusJakartaSans_500Medium"],
        semi:   ["PlusJakartaSans_600SemiBold"],
        bold:   ["PlusJakartaSans_700Bold"],
      },
    },
  },
  plugins: [],
};
```

## Step 3 — `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .screen        { @apply flex-1 bg-canvas; }
  .screen-pad    { @apply px-5; }

  .card          { @apply bg-surface rounded-2xl p-5; }
  .card-cream    { @apply bg-surface rounded-2xl p-5; }
  .card-dark     { @apply bg-ink rounded-2xl p-5; }
  .card-lime     { @apply bg-lime rounded-2xl p-5; }

  .pill          { @apply rounded-full px-4 py-2; }
  .pill-active   { @apply bg-lime; }
  .pill-idle     { @apply bg-transparent; }

  .btn-primary   { @apply bg-lime rounded-full px-6 py-4 items-center; }
  .btn-dark      { @apply bg-ink rounded-full px-6 py-4 items-center; }
  .btn-ghost     { @apply bg-surface rounded-full px-6 py-4 items-center; }

  .icon-tile     { @apply w-14 h-14 rounded-2xl bg-surface items-center justify-center; }
  .icon-tile-on  { @apply w-14 h-14 rounded-2xl bg-lime items-center justify-center; }

  .text-display  { @apply text-[44px] leading-[50px] font-bold text-ink; }
  .text-h1       { @apply text-[32px] leading-[38px] font-bold text-ink; }
  .text-h2       { @apply text-[24px] leading-[30px] font-semi text-ink; }
  .text-h3       { @apply text-[20px] leading-[26px] font-semi text-ink; }
  .text-body     { @apply text-base font-medium text-ink; }
  .text-muted    { @apply text-sm font-medium text-muted; }
  .text-micro    { @apply text-[10px] leading-[14px] font-semi tracking-wide; }

  .hairline      { @apply h-px bg-hairline; }
}
```

## Step 4 — Font loading

`app/_layout.tsx` (replace previous stub):
```tsx
import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

## Step 5 — UI primitives

`components/ui/Button.tsx`:
```tsx
import { Pressable, Text, View, ActivityIndicator } from "react-native";
import { ReactNode } from "react";

type Variant = "primary" | "dark" | "ghost";
type Size = "md" | "lg";

export function Button({
  variant = "primary", size = "lg", onPress, disabled, loading, children, leadIcon,
}: {
  variant?: Variant; size?: Size;
  onPress?: () => void; disabled?: boolean; loading?: boolean;
  children: ReactNode; leadIcon?: ReactNode;
}) {
  const base = "rounded-full items-center flex-row justify-center";
  const sizing = size === "lg" ? "px-6 py-4" : "px-5 py-3";
  const bg = variant === "primary" ? "bg-lime"
           : variant === "dark"    ? "bg-ink"
           : "bg-surface";
  const txt = variant === "primary" ? "text-ink"
            : variant === "dark"    ? "text-inverse"
            : "text-ink";
  const dim = disabled || loading ? "opacity-50" : "";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`${base} ${sizing} ${bg} ${dim} active:opacity-90`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "dark" ? "#F5FFE0" : "#0E1410"} />
      ) : (
        <View className="flex-row items-center gap-2">
          {leadIcon}
          <Text className={`${txt} font-semi text-base`}>{children}</Text>
        </View>
      )}
    </Pressable>
  );
}
```

`components/ui/Card.tsx`:
```tsx
import { View, ViewProps } from "react-native";
import { ReactNode } from "react";

type Tone = "cream" | "dark" | "lime" | "white";

export function Card({
  tone = "cream", children, className = "", ...rest
}: ViewProps & { tone?: Tone; children: ReactNode }) {
  const bg = tone === "cream" ? "bg-surface"
           : tone === "dark"  ? "bg-ink"
           : tone === "lime"  ? "bg-lime"
           : "bg-white";
  return (
    <View {...rest} className={`${bg} rounded-2xl p-5 ${className}`}>
      {children}
    </View>
  );
}
```

`components/ui/Input.tsx`:
```tsx
import { TextInput, TextInputProps, View, Text } from "react-native";
import { ReactNode } from "react";

export function Input({
  label, error, leftIcon, ...rest
}: TextInputProps & { label?: string; error?: string; leftIcon?: ReactNode }) {
  return (
    <View>
      {label && <Text className="text-muted mb-2">{label}</Text>}
      <View className={`flex-row items-center bg-surface rounded-xl px-4 py-4 ${error ? "border border-danger" : ""}`}>
        {leftIcon}
        <TextInput
          placeholderTextColor="#7A867A"
          className="flex-1 text-ink font-medium text-base"
          {...rest}
        />
      </View>
      {error && <Text className="text-danger text-xs mt-1">{error}</Text>}
    </View>
  );
}
```

`components/ui/Pill.tsx`:
```tsx
import { Pressable, Text } from "react-native";
import { ReactNode } from "react";

export function Pill({
  active, onPress, children,
}: { active?: boolean; onPress?: () => void; children: ReactNode }) {
  return (
    <Pressable
      onPress={onPress}
      className={`rounded-full px-4 py-2 ${active ? "bg-lime" : "bg-transparent"}`}
    >
      <Text className={`font-semi ${active ? "text-ink" : "text-muted"}`}>{children}</Text>
    </Pressable>
  );
}
```

`components/ui/Avatar.tsx`:
```tsx
import { Image, View, Text } from "react-native";

export function Avatar({
  uri, name, size = 48, ring,
}: { uri?: string; name: string; size?: number; ring?: boolean }) {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <View
      className={`bg-canvas-alt items-center justify-center ${ring ? "border-2 border-lime" : ""}`}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text className="text-ink font-bold">{initials}</Text>
      )}
    </View>
  );
}
```

`components/ui/ScreenContainer.tsx`:
```tsx
import { View, ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReactNode } from "react";

export function ScreenContainer({
  children, padded = true, className = "", ...rest
}: ViewProps & { children: ReactNode; padded?: boolean }) {
  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={["top"]}>
      <View {...rest} className={`flex-1 ${padded ? "px-5" : ""} ${className}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
```

## Step 6 — Dev preview route

`app/dev.tsx` (delete before launch):
```tsx
import { ScrollView, View, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Pill } from "@/components/ui/Pill";
import { Avatar } from "@/components/ui/Avatar";
import { ScreenContainer } from "@/components/ui/ScreenContainer";

export default function Dev() {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingVertical: 24, gap: 16 }}>
        <Text className="text-h1">Components</Text>

        <View className="gap-3">
          <Button>Primary</Button>
          <Button variant="dark">Dark</Button>
          <Button variant="ghost">Ghost</Button>
          <Button loading>Loading</Button>
        </View>

        <Card tone="cream"><Text className="text-body">Cream card</Text></Card>
        <Card tone="dark"><Text className="text-inverse">Dark card</Text></Card>
        <Card tone="lime"><Text className="text-ink">Lime card</Text></Card>

        <Input label="Email" placeholder="you@palmusd.com" />

        <View className="flex-row bg-surface rounded-full p-1 gap-1 self-start">
          <Pill active>Today</Pill>
          <Pill>Weekly</Pill>
          <Pill>Monthly</Pill>
          <Pill>Yearly</Pill>
        </View>

        <View className="flex-row gap-3">
          <Avatar name="William Current" />
          <Avatar name="Azie" ring />
          <Avatar name="Chasir" />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
```

## Done when
- `/dev` route renders all primitives without errors
- Lime, ink, cream tones match the reference shots when compared visually
- Font weight changes are visible (text-h1 vs text-body)
