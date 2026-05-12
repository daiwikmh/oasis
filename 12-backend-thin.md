# 12 — Thin Backend

**Platform-neutral backend service.** Web client (spec 01) and any future native client (post-MVP) both consume this API. **Decision (2026-05-09):** backend stays as a separate Hono service on Railway — not collapsed into Next.js route handlers. Reasoning: it must serve future native clients without re-platforming, and it makes the auth/cors story uniform.

> Goal: ship a minimal, fast backend that handles only what the client can't do alone — authenticated CRUD for payroll batches and contacts, push token registration. **The mint/redeem proxy in this spec is obsolete** (Palm has no onramp API; see spec 08 — Reserves Transparency replaces it). The `mint.ts` route, `mintIntents` table, and `palm.ts` client are deletion candidates in the next code-rewrite pass.

## Stack
- **Hono** on **Bun** — fastest cold start, smallest deps, TypeScript native
- **Postgres on Neon** — serverless, free tier covers MVP
- **Drizzle ORM** — type-safe SQL, plays nicely with Bun
- **Privy server SDK** for token verification (works for both web and future native clients)
- Hosted on **Railway** (or Fly, but Railway has the simplest Bun deploy)
- CORS configured for `oasis.palmusd.com` (or chosen domain) only — not `*` in production

## Repo layout

```
oasis-backend/
├── src/
│   ├── index.ts              # Hono app entry
│   ├── env.ts                # zod-validated env
│   ├── auth.ts               # Privy token middleware
│   ├── db/
│   │   ├── client.ts         # Drizzle setup
│   │   └── schema.ts         # Tables
│   ├── routes/
│   │   ├── payroll.ts
│   │   ├── contacts.ts
│   │   ├── push.ts
│   │   └── mint.ts           # Proxy to Palm rails
│   └── lib/
│       └── palm.ts           # Palm API client
├── drizzle/                  # migrations
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── bun.lockb
└── Dockerfile
```

## Acceptance criteria
- `POST /v1/payroll/batches` saves a batch; `GET /v1/payroll/batches` lists the caller's batches
- `POST /v1/contacts` adds a contact; `GET /v1/contacts` lists them
- `POST /v1/push-tokens` upserts the device's Expo push token
- `POST /v1/mint-intents` proxies to Palm with the caller's identity attached; `GET /v1/mint-intents/:ref` returns status
- All routes require a valid Privy access token
- Health check at `GET /health` returns `200`

---

## Step 1 — Init

```bash
mkdir oasis-backend && cd oasis-backend
bun init -y
bun add hono @hono/zod-validator zod
bun add @privy-io/server-auth
bun add drizzle-orm postgres
bun add -d drizzle-kit @types/bun
```

`package.json`:
```json
{
  "scripts": {
    "dev": "bun --hot src/index.ts",
    "start": "bun src/index.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

## Step 2 — Env

`src/env.ts`:
```ts
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().url(),
  PRIVY_APP_ID: z.string(),
  PRIVY_APP_SECRET: z.string(),
  PALM_API_BASE: z.string().url().optional(), // mint/redeem rail
  PALM_API_KEY: z.string().optional(),
  ENV: z.enum(["development", "staging", "production"]).default("development"),
});

export const env = schema.parse(process.env);
```

## Step 3 — DB schema

`src/db/schema.ts`:
```ts
import {
  pgTable, text, timestamp, jsonb, integer, primaryKey,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  privyId: text("privy_id").primaryKey(),       // sub from Privy JWT
  email: text("email"),
  walletAddress: text("wallet_address"),
  kycTier: text("kyc_tier").default("none"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payrollBatches = pgTable("payroll_batches", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.privyId).notNull(),
  name: text("name").notNull(),
  frequency: text("frequency").notNull(),       // once | weekly | biweekly | monthly
  nextRunAt: timestamp("next_run_at"),
  endAfterRuns: integer("end_after_runs"),
  runsCompleted: integer("runs_completed").default(0).notNull(),
  status: text("status").default("draft").notNull(),
  employees: jsonb("employees").$type<EmployeeJson[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

interface EmployeeJson {
  id: string; name: string; walletAddress?: string; email?: string;
  amountPusd: string; status?: string; signature?: string;
}

export const contacts = pgTable("contacts", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id").references(() => users.privyId).notNull(),
  name: text("name").notNull(),
  walletAddress: text("wallet_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pushTokens = pgTable("push_tokens", {
  ownerId: text("owner_id").references(() => users.privyId).notNull(),
  token: text("token").notNull(),
  platform: text("platform").notNull(),         // ios | android
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.ownerId, t.token] }) }));

export const mintIntents = pgTable("mint_intents", {
  reference: text("reference").primaryKey(),
  ownerId: text("owner_id").references(() => users.privyId).notNull(),
  direction: text("direction").notNull(),       // mint | redeem
  amountFiat: integer("amount_fiat_cents").notNull(),
  currency: text("currency").default("USD").notNull(),
  rail: text("rail").notNull(),
  status: text("status").default("submitted").notNull(),
  palmRef: text("palm_ref"),                    // Palm's external ID
  paymentInstructions: jsonb("payment_instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

`src/db/client.ts`:
```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../env";
import * as schema from "./schema";

export const sql = postgres(env.DATABASE_URL, { max: 10 });
export const db = drizzle(sql, { schema });
```

`drizzle.config.ts`:
```ts
import type { Config } from "drizzle-kit";
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

## Step 4 — Auth middleware

`src/auth.ts`:
```ts
import { createMiddleware } from "hono/factory";
import { PrivyClient } from "@privy-io/server-auth";
import { env } from "./env";
import { db } from "./db/client";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);

export const authMiddleware = createMiddleware<{ Variables: { userId: string; userEmail?: string } }>(
  async (c, next) => {
    const auth = c.req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) return c.json({ error: "unauthorized" }, 401);
    try {
      const { userId } = await privy.verifyAuthToken(auth.slice(7));
      // Upsert user record
      await db.insert(users).values({ privyId: userId }).onConflictDoNothing();
      c.set("userId", userId);
      await next();
    } catch {
      return c.json({ error: "invalid token" }, 401);
    }
  }
);
```

## Step 5 — Routes

`src/routes/payroll.ts`:
```ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client";
import { payrollBatches } from "../db/schema";
import { authMiddleware } from "../auth";

const employeeSchema = z.object({
  id: z.string(),
  name: z.string(),
  walletAddress: z.string().optional(),
  email: z.string().email().optional(),
  amountPusd: z.string(),
  status: z.string().optional(),
  signature: z.string().optional(),
});

const batchSchema = z.object({
  id: z.string(),
  name: z.string(),
  frequency: z.enum(["once", "weekly", "biweekly", "monthly"]),
  nextRunAt: z.string().optional(),
  endAfterRuns: z.number().optional(),
  employees: z.array(employeeSchema),
  status: z.string().default("draft"),
});

export const payrollRouter = new Hono()
  .use(authMiddleware)
  .get("/", async (c) => {
    const userId = c.get("userId");
    const rows = await db.select().from(payrollBatches)
      .where(eq(payrollBatches.ownerId, userId))
      .orderBy(desc(payrollBatches.createdAt));
    return c.json(rows);
  })
  .post("/", zValidator("json", batchSchema), async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const [row] = await db.insert(payrollBatches).values({
      id: body.id,
      ownerId: userId,
      name: body.name,
      frequency: body.frequency,
      nextRunAt: body.nextRunAt ? new Date(body.nextRunAt) : null,
      endAfterRuns: body.endAfterRuns,
      employees: body.employees,
      status: body.status,
    }).onConflictDoUpdate({
      target: payrollBatches.id,
      set: {
        employees: body.employees,
        status: body.status,
        updatedAt: new Date(),
      },
    }).returning();
    return c.json(row);
  });
```

`src/routes/contacts.ts`:
```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { contacts } from "../db/schema";
import { authMiddleware } from "../auth";

export const contactsRouter = new Hono()
  .use(authMiddleware)
  .get("/", async (c) => {
    const rows = await db.select().from(contacts).where(eq(contacts.ownerId, c.get("userId")));
    return c.json(rows);
  })
  .post("/", zValidator("json", z.object({
    id: z.string(), name: z.string(), walletAddress: z.string(),
  })), async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const [row] = await db.insert(contacts).values({ ...body, ownerId: userId }).returning();
    return c.json(row);
  });
```

`src/routes/push.ts`:
```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { db } from "../db/client";
import { pushTokens } from "../db/schema";
import { authMiddleware } from "../auth";

export const pushRouter = new Hono()
  .use(authMiddleware)
  .post("/", zValidator("json", z.object({
    token: z.string(),
    platform: z.enum(["ios", "android"]),
  })), async (c) => {
    const body = c.req.valid("json");
    await db.insert(pushTokens).values({
      ownerId: c.get("userId"),
      token: body.token,
      platform: body.platform,
    }).onConflictDoUpdate({
      target: [pushTokens.ownerId, pushTokens.token],
      set: { updatedAt: new Date() },
    });
    return c.json({ ok: true });
  });
```

## Step 6 — Mint/redeem proxy

`src/lib/palm.ts`:
```ts
import { env } from "../env";

// ⚠️ Replace with actual Palm endpoints once shared.
export interface PalmCreateIntent {
  reference: string;
  walletAddress: string;
  amountFiat: number;
  currency: string;
  rail: string;
  direction: "mint" | "redeem";
}

export interface PalmIntent {
  reference: string;          // our reference, echoed back
  palmRef: string;            // Palm's external ID
  status: "awaiting_payment" | "processing" | "completed" | "failed";
  paymentInstructions: unknown;
  feeFiat: number;
  pusdAmount: string;
  expiresAt: string;
}

export async function palmCreateIntent(body: PalmCreateIntent): Promise<PalmIntent> {
  if (!env.PALM_API_BASE || !env.PALM_API_KEY) {
    // Mock for local dev — return a fake ACH instruction
    return {
      reference: body.reference,
      palmRef: `mock_${Date.now()}`,
      status: "awaiting_payment",
      paymentInstructions: body.rail === "ach"
        ? { bankName: "Mock Bank", routing: "021000021", account: "0987654321", reference: body.reference }
        : { url: "https://mock-checkout.example.com/" + body.reference },
      feeFiat: body.rail === "wire" ? 15 : body.amountFiat * 0.005,
      pusdAmount: String(Math.floor(body.amountFiat * 1_000_000)),
      expiresAt: new Date(Date.now() + 60 * 60_000).toISOString(),
    };
  }
  const res = await fetch(`${env.PALM_API_BASE}/intents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.PALM_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Palm ${res.status}`);
  return res.json();
}

export async function palmGetIntent(reference: string): Promise<PalmIntent> {
  if (!env.PALM_API_BASE || !env.PALM_API_KEY) {
    return {
      reference, palmRef: `mock_${reference}`, status: "completed",
      paymentInstructions: null, feeFiat: 0, pusdAmount: "0",
      expiresAt: new Date().toISOString(),
    };
  }
  const res = await fetch(`${env.PALM_API_BASE}/intents/${reference}`, {
    headers: { Authorization: `Bearer ${env.PALM_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Palm ${res.status}`);
  return res.json();
}
```

`src/routes/mint.ts`:
```ts
import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { db } from "../db/client";
import { mintIntents } from "../db/schema";
import { authMiddleware } from "../auth";
import { palmCreateIntent, palmGetIntent } from "../lib/palm";

export const mintRouter = new Hono()
  .use(authMiddleware)
  .post("/", zValidator("json", z.object({
    walletAddress: z.string(),
    amountFiat: z.number().positive(),
    currency: z.literal("USD"),
    rail: z.enum(["card", "ach", "wire", "sepa"]),
    direction: z.enum(["mint", "redeem"]),
  })), async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const reference = `oasis_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const palm = await palmCreateIntent({ ...body, reference });

    await db.insert(mintIntents).values({
      reference,
      ownerId: userId,
      direction: body.direction,
      amountFiat: Math.round(body.amountFiat * 100),
      currency: body.currency,
      rail: body.rail,
      status: palm.status,
      palmRef: palm.palmRef,
      paymentInstructions: palm.paymentInstructions as object,
    });

    return c.json({
      reference,
      status: palm.status,
      paymentInstructions: palm.paymentInstructions,
      feeFiat: palm.feeFiat,
      pusdAmount: palm.pusdAmount,
      expiresAt: palm.expiresAt,
    });
  })
  .get("/:ref", async (c) => {
    const userId = c.get("userId");
    const ref = c.req.param("ref");
    const [row] = await db.select().from(mintIntents)
      .where(and(eq(mintIntents.reference, ref), eq(mintIntents.ownerId, userId)));
    if (!row) return c.json({ error: "not found" }, 404);

    // Refresh from Palm if not terminal
    if (row.status !== "completed" && row.status !== "failed") {
      const palm = await palmGetIntent(ref);
      if (palm.status !== row.status) {
        await db.update(mintIntents).set({ status: palm.status, updatedAt: new Date() })
          .where(eq(mintIntents.reference, ref));
        row.status = palm.status;
      }
    }

    return c.json({
      reference: row.reference,
      status: row.status,
      paymentInstructions: row.paymentInstructions,
      feeFiat: 0,                             // Palm computes — fetch fresh if needed
      pusdAmount: "0",
      expiresAt: new Date().toISOString(),
    });
  });
```

## Step 7 — App entry

`src/index.ts`:
```ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { env } from "./env";
import { payrollRouter } from "./routes/payroll";
import { contactsRouter } from "./routes/contacts";
import { pushRouter } from "./routes/push";
import { mintRouter } from "./routes/mint";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: "*", allowHeaders: ["Authorization", "Content-Type"] }));

app.get("/health", (c) => c.json({ ok: true, env: env.ENV }));

app.route("/v1/payroll/batches", payrollRouter);
app.route("/v1/contacts", contactsRouter);
app.route("/v1/push-tokens", pushRouter);
app.route("/v1/mint-intents", mintRouter);

export default { port: env.PORT, fetch: app.fetch };
```

## Step 8 — Dockerfile (Railway)

`Dockerfile`:
```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 8787
CMD ["bun", "src/index.ts"]
```

## Step 9 — Deploy

```bash
# Locally
bun run db:generate
bun run db:migrate
bun run dev

# Railway
railway init
railway link
railway up
# Set env vars in dashboard: DATABASE_URL, PRIVY_APP_ID, PRIVY_APP_SECRET, PALM_API_BASE, PALM_API_KEY
```

Neon: spin up a Postgres instance, copy the pooled connection string into `DATABASE_URL`.

## Step 10 — Open work for Palm integration

The mint/redeem proxy currently mocks responses when `PALM_API_BASE` is unset. Once Palm shares the real endpoints:
1. Replace the `palm.ts` request shape to match their spec
2. Add a webhook handler at `POST /v1/webhooks/palm` to receive status updates instead of polling (better UX, lower latency)
3. Add signature verification on the webhook (Palm-shared secret or HMAC)

## Done when
- Health check returns 200 from production URL
- Mobile app can save and fetch payroll batches from a fresh login
- Mock mint intent flow works end-to-end with the mobile app polling `/v1/mint-intents/:ref`
- Migrations apply cleanly to a new Neon database
