# 01 — Project Setup

**Platform: web (Next.js 15 App Router).** Sets the platform contract for every other spec. No Expo, no React Native, no NativeWind, no EAS.

> Goal: bootstrap a Next.js 15 (App Router) project with TypeScript, Tailwind v4, shadcn/ui, path aliases, and the env scaffold for Oasis.

**Note:** The step-by-step body below predates the 2026-05-09 web pivot and references Expo/RN. Headers and acceptance criteria here are authoritative; step bodies will be rewritten in follow-up passes.

## Prereqs
None. This is the first spec.

## Acceptance criteria
- `next dev` boots a blank page with Tailwind classes working
- Path aliases resolve (`import { Foo } from "@/components/ui/Foo"`)
- Three env files exist: `.env.development`, `.env.staging`, `.env.production`
- Sentry + PostHog browser SDKs installed (not yet initialized)
- `lib/` directory is framework-free so a future native app can import it

---

## Step 1 — Init

```bash
npx create-expo-app@latest oasis --template blank-typescript
cd oasis
npx expo install expo-router expo-linking expo-constants expo-status-bar \
  expo-secure-store expo-font expo-splash-screen expo-notifications \
  react-native-safe-area-context react-native-screens react-native-gesture-handler \
  react-native-reanimated react-native-svg
```

## Step 2 — NativeWind v4

```bash
npm install nativewind tailwindcss@^3.4 react-native-css-interop
npx tailwindcss init
```

Edit `package.json` main entry:
```json
"main": "expo-router/entry"
```

## Step 3 — Core deps

```bash
# Solana
npm install @solana/web3.js @solana/spl-token bs58 buffer

# Auth
npm install @privy-io/expo @privy-io/expo-native-extensions

# Data + state
npm install @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers

# UI
npm install @shopify/flash-list lucide-react-native
npm install @gorhom/bottom-sheet react-native-qrcode-svg

# Charts
npm install react-native-gifted-charts

# Telemetry
npm install @sentry/react-native posthog-react-native

# Fonts
npx expo install @expo-google-fonts/plus-jakarta-sans
```

## Step 4 — Folder structure

Create these directories (empty `.gitkeep` for now):

```
app/
  (auth)/
  (tabs)/
components/
  ui/
  wallet/
  stats/
  swap/
  payroll/
  mint/
  nav/
hooks/
lib/
  solana/
  privy/
  api/
  tokens/
  utils/
stores/
theme/
docs/
  specs/
```

## Step 5 — `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

## Step 6 — `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      ["module-resolver", { alias: { "@": "./" } }],
      "react-native-reanimated/plugin", // must be last
    ],
  };
};
```

```bash
npm install -D babel-plugin-module-resolver
```

## Step 7 — `metro.config.js`

```js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: "./global.css" });
```

## Step 8 — Env files

`.env.development`:
```
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_PRIVY_APP_ID=
EXPO_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
EXPO_PUBLIC_HELIUS_KEY=
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_PUSD_MINT_SOLANA=DEVNET_TEST_MINT_HERE
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_POSTHOG_KEY=
```

`.env.staging` and `.env.production` mirror the structure with prod values.

Add `.env*` to `.gitignore` except `.env.example`.

## Step 9 — Stub `app/_layout.tsx`

```tsx
import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
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

## Step 10 — Stub `app/index.tsx`

```tsx
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-canvas">
      <Text className="text-h2 text-ink">Oasis 🌴</Text>
    </View>
  );
}
```

## Done when
- `npx expo start --tunnel` shows "Oasis 🌴" with the lime-cream background applied via Tailwind classes (theme spec 02 will define the colors; for now, `bg-canvas` will fall back to a default)
- TypeScript has zero errors
- Path alias `@/` works in any new file
