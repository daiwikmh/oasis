import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { env } from "./env";
import { payrollRouter } from "./routes/payroll";
import { contactsRouter } from "./routes/contacts";
import { pushRouter } from "./routes/push";

const app = new Hono();

app.use("*", logger());
app.use("*", cors({ origin: "*", allowHeaders: ["Authorization", "Content-Type"] }));

app.get("/health", (c) => c.json({ ok: true, env: env.ENV }));

app.route("/v1/payroll/batches", payrollRouter);
app.route("/v1/contacts", contactsRouter);
app.route("/v1/push-tokens", pushRouter);

export default { port: env.PORT, fetch: app.fetch };
