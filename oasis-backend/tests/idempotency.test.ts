import { test, expect } from "bun:test";
import { Hono } from "hono";
import { idempotency } from "../src/middleware/idempotency";

function makeApp() {
  let counter = 0;
  const app = new Hono();
  app.use("*", idempotency);
  app.post("/echo", async (c) => {
    counter++;
    return c.json({ counter });
  });
  return app;
}

test("idempotency: repeated POST with same key returns cached result", async () => {
  const app = makeApp();
  const headers = { "Idempotency-Key": "k1", "Content-Type": "application/json" };

  const a = await app.request("/echo", { method: "POST", headers, body: "{}" });
  const b = await app.request("/echo", { method: "POST", headers, body: "{}" });

  expect(a.status).toBe(200);
  expect(b.status).toBe(200);
  expect(await a.json()).toEqual({ counter: 1 });
  expect(await b.json()).toEqual({ counter: 1 });
});

test("idempotency: different keys produce different results", async () => {
  const app = makeApp();
  const a = await app.request("/echo", { method: "POST", headers: { "Idempotency-Key": "a", "Content-Type": "application/json" }, body: "{}" });
  const b = await app.request("/echo", { method: "POST", headers: { "Idempotency-Key": "b", "Content-Type": "application/json" }, body: "{}" });
  expect(await a.json()).toEqual({ counter: 1 });
  expect(await b.json()).toEqual({ counter: 2 });
});

test("idempotency: no key means no caching", async () => {
  const app = makeApp();
  const a = await app.request("/echo", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  const b = await app.request("/echo", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  expect(await a.json()).toEqual({ counter: 1 });
  expect(await b.json()).toEqual({ counter: 2 });
});
