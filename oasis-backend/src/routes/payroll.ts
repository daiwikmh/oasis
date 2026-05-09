import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/client";
import { payrollBatches } from "../db/schema";
import { authMiddleware } from "../auth";
import { idempotency } from "../middleware/idempotency";

const employeeSchema = z.object({
  id:            z.string(),
  name:          z.string(),
  walletAddress: z.string().optional(),
  email:         z.string().email().optional(),
  amountPusd:    z.string(),
  status:        z.string().optional(),
  signature:     z.string().optional(),
});

const batchSchema = z.object({
  id:           z.string(),
  name:         z.string(),
  frequency:    z.enum(["once", "weekly", "biweekly", "monthly"]),
  nextRunAt:    z.string().optional(),
  endAfterRuns: z.number().optional(),
  employees:    z.array(employeeSchema),
  status:       z.string().default("draft"),
});

export const payrollRouter = new Hono()
  .use(authMiddleware)
  .use(idempotency)
  .get("/", async (c) => {
    const rows = await db.select().from(payrollBatches)
      .where(eq(payrollBatches.ownerId, c.get("userId")))
      .orderBy(desc(payrollBatches.createdAt));
    return c.json(rows);
  })
  .post("/", zValidator("json", batchSchema), async (c) => {
    const userId = c.get("userId");
    const body = c.req.valid("json");
    const [row] = await db.insert(payrollBatches).values({
      id:           body.id,
      ownerId:      userId,
      name:         body.name,
      frequency:    body.frequency,
      nextRunAt:    body.nextRunAt ? new Date(body.nextRunAt) : null,
      endAfterRuns: body.endAfterRuns,
      employees:    body.employees,
      status:       body.status,
    }).onConflictDoUpdate({
      target: payrollBatches.id,
      set:    { employees: body.employees, status: body.status, updatedAt: new Date() },
    }).returning();
    return c.json(row);
  });
