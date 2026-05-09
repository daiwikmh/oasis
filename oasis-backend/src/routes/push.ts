import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/client";
import { pushTokens } from "../db/schema";
import { authMiddleware } from "../auth";

export const pushRouter = new Hono()
  .use(authMiddleware)
  .post("/", zValidator("json", z.object({
    token:    z.string(),
    platform: z.enum(["ios", "android"]),
  })), async (c) => {
    const body = c.req.valid("json");
    await db.insert(pushTokens).values({
      ownerId:  c.get("userId"),
      token:    body.token,
      platform: body.platform,
    }).onConflictDoUpdate({
      target: [pushTokens.ownerId, pushTokens.token],
      set:    { updatedAt: new Date() },
    });
    return c.json({ ok: true });
  });
