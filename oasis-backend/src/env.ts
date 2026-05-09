import { z } from "zod";

const schema = z.object({
  PORT:              z.coerce.number().default(8787),
  DATABASE_URL:      z.string().url(),
  PRIVY_APP_ID:      z.string(),
  PRIVY_APP_SECRET:  z.string(),
  ENV:               z.enum(["development", "staging", "production"]).default("development"),
});

export const env = schema.parse(process.env);
