import { createMiddleware } from "hono/factory";

const cache = new Map<string, { body: unknown; status: number; expiresAt: number }>();
const TTL_MS = 24 * 60 * 60_000;

function gc() {
  const now = Date.now();
  for (const [k, v] of cache) if (v.expiresAt < now) cache.delete(k);
}

export const idempotency = createMiddleware(async (c, next) => {
  const key = c.req.header("Idempotency-Key");
  if (!key) return next();
  if (c.req.method !== "POST") return next();

  gc();
  const userId = c.get("userId" as never) ?? "anon";
  const cacheKey = `${userId}:${c.req.path}:${key}`;
  const hit = cache.get(cacheKey);
  if (hit) return c.json(hit.body as object, hit.status as 200);

  await next();

  const status = c.res.status;
  if (status >= 200 && status < 300) {
    const body = await c.res.clone().json().catch(() => null);
    if (body) cache.set(cacheKey, { body, status, expiresAt: Date.now() + TTL_MS });
  }
});
