import { createMiddleware } from "hono/factory";
import { PrivyClient } from "@privy-io/server-auth";
import { env } from "./env";
import { db } from "./db/client";
import { users } from "./db/schema";

const privy = new PrivyClient(env.PRIVY_APP_ID, env.PRIVY_APP_SECRET);

type AuthVariables = { userId: string };

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(
  async (c, next) => {
    const auth = c.req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) return c.json({ error: "unauthorized" }, 401);
    try {
      const { userId } = await privy.verifyAuthToken(auth.slice(7));
      await db.insert(users).values({ privyId: userId }).onConflictDoNothing();
      c.set("userId", userId);
      await next();
    } catch {
      return c.json({ error: "invalid token" }, 401);
    }
  }
);
