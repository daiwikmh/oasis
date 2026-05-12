# Oasis

A non-custodial web wallet and finance platform built on **Palm USD (PUSD)** — a 6-decimal, non-freezable stablecoin native to Solana, Ethereum, BNB, TRON, and ADI. v1 ships Solana-only.

> Self-custody. No volatility. Every transaction is final.

---

## What it is

Oasis lets individuals and businesses hold, send, swap, earn, and spend PUSD from a single web app. There is no centralized custody, no admin freeze key, and no blacklist — users own their keys via Privy's embedded wallet.

The primary B2B differentiator is the **Payroll** module: bulk PUSD disbursements to up to 100 employees, CSV-importable, with recurring schedule support. Everything else (wallet, swaps, analytics, transparency) supports the individual use case.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind v3 + shadcn/ui |
| Auth | Privy web SDK — email OTP + embedded Solana wallet |
| Chain | Solana via @solana/web3.js + @solana/spl-token |
| Swaps | Jupiter v6 API |
| State | TanStack Query (chain reads) + Zustand (UI state) |
| Backend | Hono on Bun + Postgres (Neon) + Drizzle ORM on Railway |
| Hosting | Vercel (web) + Railway (API) |

---

## Features

### Wallet
The home screen. Shows live PUSD balance, quick-action Send/Receive buttons, and the last 5 transactions. Full transaction history is linked to Statistics.

### Send
Modal-driven send flow. Accepts a Solana wallet address and PUSD amount. Builds and signs an SPL token transfer via the embedded Privy wallet. All amounts are represented as `bigint` (6 decimals) internally and formatted only at render.

### Receive
Generates a QR code of the user's embedded wallet address for peer-to-peer PUSD receipt.

### Statistics
Earning and spending analytics with period filters: Today, Weekly, Monthly, Yearly. Rendered as a dual-bar Recharts chart (lime = earned, dark = spent). Reads from on-chain transaction history.

### Swaps
PUSD ↔ USDC swaps via Jupiter v6. Features:
- Configurable slippage (0.1% / 0.5% / 1%)
- Real-time price impact with blocking at >3%
- Best-route display
- Solscan transaction link after confirmation
- MoonPay CTA for users who need to buy USDC with a card first

### Payroll
Bulk PUSD payouts for businesses. Features:
- Named batches with up to 100 employee recipients
- CSV import for recipient lists
- Recurring frequency support (weekly, biweekly, monthly)
- Month-to-date spend summary dashboard
- One wallet signature per recipient disbursement

### Transparency
Live PUSD circulating supply pulled from Palm's public API (`palmusd.com/api/v1/circulation` + `/circulation/history`). Displays:
- Total circulating supply by chain (Ethereum, Solana, BSC, ADI)
- Historical supply area chart
- Link out to palmusd.com for proof-of-reserves attestations

### Commerce (stub)
Bitrefill product catalog — browse gift cards, mobile refills, eSIMs, and bill payments. Bitrefill does not accept PUSD; the page surfaces a swap-to-USDC banner. No in-app checkout — clicks open bitrefill.com.

### Shopping / Gift Cards
v1 shells, deferred to v2.

---

## Flow diagrams

### Auth & onboarding

```mermaid
flowchart TD
    A[Landing page] --> B{First visit?}
    B -- yes --> C[Onboarding slides\n3-step carousel]
    B -- no --> E
    C --> D[Get started]
    D --> E[Login — email OTP via Privy]
    E --> F{Wallet exists?}
    F -- yes --> G[Dashboard]
    F -- no --> H[Privy creates embedded\nSolana wallet]
    H --> G
```

### Send PUSD

```mermaid
flowchart TD
    A[Dashboard] --> B[Tap Send]
    B --> C[Enter recipient address\n+ amount]
    C --> D{Valid address\n& balance?}
    D -- no --> C
    D -- yes --> E[Build SPL transfer\ntransaction]
    E --> F[Privy signs with\nembedded wallet]
    F --> G[Broadcast to Solana\nvia Helius RPC]
    G --> H{Confirmed?}
    H -- yes --> I[Show Solscan link\nUpdate balance]
    H -- no --> J[Surface error via toast]
```

### Receive PUSD

```mermaid
flowchart TD
    A[Dashboard] --> B[Tap Receive]
    B --> C[Display QR code\nof embedded wallet address]
    C --> D[Sender scans / copies address]
    D --> E[Sender initiates transfer\nin their wallet]
    E --> F[PUSD arrives on Solana]
    F --> G[Balance updates on next\nTanStack Query refetch]
```

### Swap PUSD ↔ USDC

```mermaid
flowchart TD
    A[Swap page] --> B[Select input token\n& output token]
    B --> C[Enter amount]
    C --> D[Jupiter v6 quote\nfetched in real time]
    D --> E{Price impact?}
    E -- ">3%" --> F[Swap blocked\nShow warning]
    E -- "1–3%" --> G[Show warning\nAllow swap]
    E -- "<1%" --> H[Show quote details]
    G --> I[User confirms]
    H --> I
    I --> J[Jupiter builds\nswap transaction]
    J --> K[Privy signs]
    K --> L[Broadcast via Helius]
    L --> M[Solscan confirmation link]
```

### Fiat onramp (MoonPay path)

```mermaid
flowchart TD
    A[User has no PUSD or USDC] --> B[Tap Buy USDC on Swap page]
    B --> C[Opens MoonPay in new tab\ndefaultCurrencyCode=usdc_sol]
    C --> D[User buys USDC with card\non MoonPay]
    D --> E[USDC delivered to\nembedded wallet address]
    E --> F[Return to Oasis Swap page]
    F --> G[Swap USDC → PUSD\nvia Jupiter]
```

### Payroll batch

```mermaid
flowchart TD
    A[Payroll dashboard] --> B[New batch]
    B --> C[Name batch\n+ set frequency]
    C --> D{Add employees}
    D -- manual --> E[Enter name\nwallet + amount]
    D -- CSV --> F[Upload CSV\nparse up to 100 rows]
    E --> G[Review batch summary]
    F --> G
    G --> H[Confirm & disburse]
    H --> I[For each recipient:\nbuild SPL transfer]
    I --> J[Privy signs each tx]
    J --> K[Broadcast to Solana]
    K --> L[Batch recorded\nMonth-to-date stats updated]
```

### Transparency / Reserves

```mermaid
flowchart TD
    A[User visits /reserves] --> B[Next.js route handler\n/api/palm/circulation]
    B --> C[Fetches palmusd.com/api/v1/circulation\nserver-side to avoid CORS]
    C --> D[Fetches /circulation/history]
    D --> E[Returns combined payload\nto client]
    E --> F[Display total supply\nby chain breakdown]
    F --> G[Render supply\nhistory area chart]
    G --> H[Link out to palmusd.com\nfor proof-of-reserves PDF]
```

---

## PUSD token addresses

| Chain | Address |
|---|---|
| Ethereum | `0xfaf0cee6b20e2aaa4b80748a6af4cd89609a3d78` |
| Solana | see `lib/tokens/pusd.ts` |
| BNB / TRON / ADI | see `lib/tokens/pusd.ts` |

Decimals: **6** on all chains.

PUSD has no admin key, no freeze function, and no blacklist. All transfers are final once confirmed.

---

## Project structure

```
oasis/
  app/
    (auth)/         login, onboarding
    (app)/          dashboard, stats, swap, payroll, commerce, profile
    reserves/       transparency screen
    api/            server route handlers (palm proxy, payroll, etc.)
  components/
    ui/             shadcn primitives
    wallet/         BalanceCard, QuickActions, SendDialog, ReceiveDialog, TxRow
    nav/            Sidebar, TopBar
  hooks/            TanStack Query hooks (chain reads only)
  lib/
    solana/         jupiter.ts, transfer.ts
    tokens/         pusd.ts (addresses + formatPusd)
  stores/           Zustand slices (UI/draft state only)
  theme/            design tokens
oasis-backend/      Hono + Bun API service (separate Railway deploy)
```

---

## Running locally

```bash
cd oasis
cp .env.example .env.local   # fill in Privy app ID, Helius RPC, Bitrefill key
npm install
npm run dev                   # http://localhost:3000
```

Backend:
```bash
cd oasis-backend
bun install
bun dev                       # http://localhost:3001
```
