import { pgTable, text, timestamp, jsonb, integer, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  privyId:       text("privy_id").primaryKey(),
  email:         text("email"),
  walletAddress: text("wallet_address"),
  kycTier:       text("kyc_tier").default("none"),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

interface EmployeeJson {
  id: string;
  name: string;
  walletAddress?: string;
  email?: string;
  amountPusd: string;
  status?: string;
  signature?: string;
}

export const payrollBatches = pgTable("payroll_batches", {
  id:            text("id").primaryKey(),
  ownerId:       text("owner_id").references(() => users.privyId).notNull(),
  name:          text("name").notNull(),
  frequency:     text("frequency").notNull(),
  nextRunAt:     timestamp("next_run_at"),
  endAfterRuns:  integer("end_after_runs"),
  runsCompleted: integer("runs_completed").default(0).notNull(),
  status:        text("status").default("draft").notNull(),
  employees:     jsonb("employees").$type<EmployeeJson[]>().notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
  updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

export const contacts = pgTable("contacts", {
  id:            text("id").primaryKey(),
  ownerId:       text("owner_id").references(() => users.privyId).notNull(),
  name:          text("name").notNull(),
  walletAddress: text("wallet_address").notNull(),
  createdAt:     timestamp("created_at").defaultNow().notNull(),
});

export const pushTokens = pgTable("push_tokens", {
  ownerId:   text("owner_id").references(() => users.privyId).notNull(),
  token:     text("token").notNull(),
  platform:  text("platform").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({ pk: primaryKey({ columns: [t.ownerId, t.token] }) }));
