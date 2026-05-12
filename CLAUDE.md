# Oasis — Claude Code Context

> Oasis is a non-custodial wallet and finance app built on **Palm USD (PUSD)**. This file is the entry context for Claude Code. Read it first; then pick up any spec in `docs/specs/`.

---

## What Oasis is

A mobile-first consumer app that lets users hold, send, swap, earn, and spend PUSD. Modules:

1. **Wallet** — balance, send, receive, transactions
2. **Statistics** — earning + spending analytics
3. **Swaps** — PUSD ↔ other SPL tokens via Jupiter
4. **Payroll** — bulk payouts (B2B differentiator)
5. **Mint/Redeem** — embedded fiat ↔ PUSD flow (powered by Palm)
6. **Stubs** — Gift Cards, Commerce, Shopping (shells for v1)

Brand identity: lime-green / cream / near-black fintech aesthetic. See `docs/specs/02-theme-system.md`.

---

## What PUSD is (and isn't)

- Standard token: **ERC-20 / SPL / BEP-20 / TRC-20** with **6 decimals** on every chain
- **Non-freezable**: no admin key, no blacklist, no pause function. Treat all transfers as final.
- **Native on each chain**, no bridge. Each chain has its own mint and redeem contracts.
- **Public circulation API** (no auth): `https://www.palmusd.com/api/v1/circulation`
- No SDK to install. **If your code works with USDC, it works with PUSD.**

Confirmed addresses (lock in `lib/tokens/pusd.ts`):
- Ethereum: `0xfaf0cee6b20e2aaa4b80748a6af4cd89609a3d78`
- Solana: ⚠️ confirm canonical SPL mint
- BNB / TRON / ADI: ⚠️ confirm

Decimals on all chains: **6**.

---

## Stack

| Layer | Choice |
|---|---|
| App | React Native + Expo SDK 51 (Expo Router) |
| Styling | NativeWind v4 |
| Auth | Privy React Native SDK (email + embedded Solana wallet) |
| Chain (v1) | Solana via `@solana/web3.js` + `@solana/spl-token` |
| Multi-chain (v2) | Ethers v6 (EVM), tronweb (TRON) — abstracted behind a `ChainAdapter` interface |
| Swaps | Jupiter v6 API |
| State | TanStack Query (chain reads) + Zustand (UI/draft) |
| Backend | Hono on Bun, Postgres (Neon), hosted on Railway |
| Push | Expo Notifications |
| Analytics | PostHog |
| Crash | Sentry |

---

## MVP scope (in order)

1. Project setup → `01-project-setup.md`
2. Theme system → `02-theme-system.md`
3. Auth + onboarding → `03-auth-onboarding.md`
4. PUSD integration → `04-pusd-integration.md`
5. Home + tabs → `05-home-and-tabs.md`
6. Statistics → `06-statistics.md`
7. Send / Receive → `07-send-receive.md`
8. Mint / Redeem (embedded) → `08-mint-redeem-embed.md`
9. Swaps → `09-swaps-jupiter.md`
10. Payroll → `10-payroll.md`
11. Stub modules → `11-stub-modules.md`
12. Thin backend → `12-backend-thin.md`
13. EAS + deploy → `13-eas-deploy.md`

Each spec is independently executable. Spec files declare prereqs explicitly.

---

## Repo conventions

- **Path aliases:** `@/components`, `@/hooks`, `@/lib`, `@/theme`, `@/stores`. Configure in `tsconfig.json` + `babel.config.js`.
- **Naming:** PascalCase components, camelCase hooks (always `useX`), kebab-case route files.
- **Amounts:** raw `bigint` internally, formatted only at the rendering edge via `formatPusd()`.
- **Errors:** never swallow chain errors. Surface to user via `useToast()`.
- **No `any`:** use `unknown` + narrow, or define types.
- **Forms:** `react-hook-form` + `zod` everywhere.
- **Lists:** `@shopify/flash-list` for any list >20 items.

---

## Compliance posture

- Token has **no freeze / blacklist / pause**. Don't write code expecting those errors.
- We do **not** maintain client-side blocklists.
- KYC happens in the embedded mint/redeem flow only (delegated to Palm). Wallet usage requires no KYC.
- Treat all transactions as final once confirmed.

---

## Don't do

- Don't add a custom RPC fallback that hits a free public endpoint in production. Use Helius (paid).
- Don't put chain reads in Zustand. Use TanStack Query.
- Don't hardcode token addresses. Read from `lib/tokens/pusd.ts`.
- Don't ship dark mode in v1. Tokens are dark-mode-ready, but it's not in scope.
- Don't add a custom design system from scratch. Compose from `components/ui/*`.

---

## When in doubt

Check the spec file for the section you're working on. If still unclear, ask before assuming.
