# 13 — Web Deploy (Vercel + Railway)

**Platform: web (Next.js 15 App Router) on Vercel; Hono backend on Railway.** See spec 01. *(File is named `13-eas-deploy.md` for backwards reference; EAS/native deploy is post-MVP.)*

> Goal: ship Oasis to production at `oasis.palmusd.com` (or chosen domain) on Vercel, with the Hono backend on Railway. Wire Sentry + PostHog browser SDKs. Configure Privy production app, Helius mainnet RPC, custom domain, preview deploys per branch. Prep public launch.

**Note:** The EAS/TestFlight/Play body below is **OBSOLETE** for v1 — kept until the rewrite pass for reference (will inform the post-MVP native deploy spec). Web deploy is a much simpler workflow: push to `main` → Vercel deploys automatically.

## Prereqs
- Specs 01–11 done (12 deployed too — backend must be live before web deploy points at it)
- Vercel account
- Railway account with the Hono backend already deployed
- Custom domain (e.g., `oasis.palmusd.com`) with DNS access
- Privy production app configured with the production domain in allowed origins
- Helius API key (paid tier — no free public RPC fallback)

## Acceptance criteria
- `vercel --prod` from `main` ships a working build at the production domain
- Preview deploys spin up per PR with a unique URL
- Environment variables set per environment (Production / Preview / Development) in Vercel dashboard — no secrets in `.env` committed to the repo
- Sentry browser SDK captures a deliberately-thrown error within 60 seconds; source maps are uploaded on each build
- PostHog identifies the Privy user ID on login and tracks: `onboarding_completed`, `send_signed`, `swap_signed`, `payroll_executed`
- Lighthouse production score: Performance ≥85, Accessibility ≥95, Best Practices ≥95, SEO ≥90
- `robots.txt` allows indexing of marketing pages (Reserves, public stubs); blocks authed routes
- Privacy policy + Terms of Service pages live and linked in the footer

## Out of scope (post-MVP)
- iOS / Android native apps (Expo + EAS)
- App Store / Play Store submission
- Push notifications via Expo (web push to PWA can be added in a later spec)

---

## Step 1 — EAS init

```bash
npm install -g eas-cli
eas login
eas init --id <expo-project-id>     # creates the project on Expo's side
```

## Step 2 — `app.json`

```json
{
  "expo": {
    "name": "Oasis",
    "slug": "oasis",
    "scheme": "oasis",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#EFF6D8"
    },
    "ios": {
      "bundleIdentifier": "com.oasis.app",
      "supportsTablet": false,
      "infoPlist": {
        "NSFaceIDUsageDescription": "Oasis uses Face ID to confirm transactions.",
        "NSCameraUsageDescription": "Scan QR codes to send PUSD."
      }
    },
    "android": {
      "package": "com.oasis.app",
      "adaptiveIcon": {
        "foregroundImage": "./assets/icon-foreground.png",
        "backgroundColor": "#C8F560"
      },
      "permissions": ["CAMERA", "USE_BIOMETRIC", "USE_FINGERPRINT"]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-local-authentication",
      "expo-notifications",
      ["expo-build-properties", {
        "ios": { "deploymentTarget": "15.1" },
        "android": { "compileSdkVersion": 34, "targetSdkVersion": 34 }
      }],
      "@sentry/react-native/expo"
    ],
    "extra": {
      "eas": { "projectId": "<from-eas-init>" }
    },
    "owner": "<expo-username-or-org>",
    "runtimeVersion": { "policy": "appVersion" },
    "updates": {
      "url": "https://u.expo.dev/<project-id>"
    }
  }
}
```

## Step 3 — `eas.json`

```json
{
  "cli": { "version": ">= 5.9.0", "appVersionSource": "remote" },
  "build": {
    "base": {
      "node": "20.11.0",
      "env": { "EXPO_PUBLIC_ENV": "development" }
    },
    "development": {
      "extends": "base",
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "env": { "EXPO_PUBLIC_ENV": "development" }
    },
    "preview": {
      "extends": "base",
      "distribution": "internal",
      "channel": "staging",
      "ios": { "simulator": false },
      "env": { "EXPO_PUBLIC_ENV": "staging" }
    },
    "production": {
      "extends": "base",
      "channel": "production",
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_ENV": "production" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "<apple-id>",
        "ascAppId": "<app-store-connect-id>",
        "appleTeamId": "<team-id>"
      },
      "android": {
        "serviceAccountKeyPath": "./android-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

## Step 4 — Env per build profile

EAS doesn't load `.env.*` automatically. Two options:
1. **Recommended:** `eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://api.oasis.app` (per env per var)
2. Inline in `eas.json` under each profile's `env` block

Set the following per environment:
```
EXPO_PUBLIC_PRIVY_APP_ID
EXPO_PUBLIC_PRIVY_CLIENT_ID
EXPO_PUBLIC_SOLANA_RPC
EXPO_PUBLIC_HELIUS_KEY
EXPO_PUBLIC_API_URL
EXPO_PUBLIC_PUSD_MINT_SOLANA
EXPO_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_POSTHOG_KEY
```

## Step 5 — Sentry init

`app/_layout.tsx` (top of file, before any provider):
```tsx
import * as Sentry from "@sentry/react-native";

if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_ENV,
    tracesSampleRate: process.env.EXPO_PUBLIC_ENV === "production" ? 0.1 : 1.0,
    enableNative: true,
  });
}

// at bottom of file
export default Sentry.wrap(RootLayout);
```

Add the Sentry source-map upload step to EAS via the plugin (`@sentry/react-native/expo`) — set `SENTRY_AUTH_TOKEN` as an EAS secret.

## Step 6 — PostHog

`lib/analytics.ts`:
```ts
import PostHog from "posthog-react-native";

export const posthog = new PostHog(process.env.EXPO_PUBLIC_POSTHOG_KEY!, {
  host: "https://us.i.posthog.com",
  flushAt: 20,
  flushInterval: 30,
});

export const track = (event: string, props?: Record<string, unknown>) => {
  posthog.capture(event, props);
};

export const identify = (userId: string, props?: Record<string, unknown>) => {
  posthog.identify(userId, props);
};
```

Wire `identify(privyUserId)` after login; track key events: `onboarding_completed`, `send_signed`, `swap_signed`, `payroll_executed`, `mint_initiated`.

## Step 7 — Push notifications

`hooks/usePushRegistration.ts`:
```ts
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { usePrivy } from "@privy-io/expo";

const API = process.env.EXPO_PUBLIC_API_URL!;

export function usePushRegistration() {
  const { user, getAccessToken } = usePrivy();

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!Device.isDevice) return;
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;

      const { data: token } = await Notifications.getExpoPushTokenAsync();
      const accessToken = await getAccessToken();
      await fetch(`${API}/v1/push-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ token, platform: Platform.OS }),
      });
    })();
  }, [user]);
}
```

Call from `app/(tabs)/_layout.tsx` once after auth.

## Step 8 — Build commands

```bash
# Dev client (run once, then iterate via Metro)
eas build --profile development --platform all

# Preview build for QA / TestFlight
eas build --profile preview --platform ios
eas build --profile preview --platform android

# Production
eas build --profile production --platform all
eas submit -p ios --latest
eas submit -p android --latest
```

## Step 9 — OTA updates

JS-only changes (UI, hooks, copy) ship via:
```bash
eas update --branch staging --message "Fix swap quote refetch"
eas update --branch production --message "v1.0.1 — small fixes"
```

Native changes (new dependency, plugin, version bump) require a fresh build.

`runtimeVersion.policy: "appVersion"` ties OTA updates to the binary's marketing version — bump `version` in `app.json` whenever native deps change so old binaries don't pull incompatible JS.

## Step 10 — Asset checklist

Before first store submission:

- [ ] App icon `./assets/icon.png` (1024×1024, no transparency)
- [ ] Adaptive icon foreground `./assets/icon-foreground.png` (1024×1024)
- [ ] Splash `./assets/splash.png` (~1284×2778, lime bg)
- [ ] iOS screenshots (6.7" + 6.5" + 5.5") — Home, Stats, Payroll, Swap, Mint
- [ ] Android screenshots (phone + 7" tablet)
- [ ] Privacy policy URL (required by Apple + Google)
- [ ] Terms of service URL
- [ ] Support email
- [ ] App description (4000 char Apple, 4000 Google)
- [ ] Promotional text + keywords
- [ ] Age rating questionnaire (financial, in-app purchases context)

## Step 11 — App Store review tips for crypto apps

Apple's section 3.1.5(b) requires crypto apps to:
- Disclose all fees (including network fees)
- Not require keys to be visible to the user (Privy's embedded wallets satisfy this)
- Not facilitate ICOs / unregistered offerings (we don't)
- Make it clear the wallet is non-custodial

For Google: Play Store has fewer hurdles but require a "Real-Money Gambling, Games, and Contests" declaration as **No**, and disclose financial features in the data safety form.

Submit a demo account in App Review notes (you can use a verified test wallet preloaded with PUSD).

## Done when
- TestFlight build installable on a real device
- Play Internal track build downloadable via opt-in link
- Triggering a deliberate crash (`throw new Error("test")` in dev) shows up in Sentry within 60 seconds
- An OTA update reaches an installed device on next launch
- Privacy + Terms URLs live and linked from the app
