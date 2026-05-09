import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
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
    id:            z.string(),
    name:          z.string(),
    walletAddress: z.string(),
  })), async (c) => {
    const [row] = await db.insert(contacts)
      .values({ ...c.req.valid("json"), ownerId: c.get("userId") })
      .returning();
    return c.json(row);
  });
