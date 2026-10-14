/**
 * 📌 Key concept — Validate environment variables at startup, not at runtime.
 * `process.env` values are always strings (or undefined) by default, and
 * nothing stops a typo like `PORT=abc` from silently breaking the app deep
 * inside some unrelated code path.
 *
 * By parsing `process.env` through a Zod schema once, here, we get:
 *   - Type coercion (`z.coerce.number()` turns "3000" into 3000).
 *   - Defaults (`.default(3000)`) when a variable isn't set.
 *   - Fail-fast validation: if PORT were "abc", `envSchema.parse` throws
 *     immediately when the module loads — the app won't even start with a
 *     broken config, instead of failing mysteriously later.
 *
 * Every other file imports the already-validated `env` object (see
 * index.ts, middlewares/error.middleware.ts) instead of touching
 * `process.env` directly.
 */
import {z} from "zod";

export const NODE_ENV = ['development', 'production', 'test'] as const;

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(NODE_ENV).default('development'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  CORS_ORIGIN: z.string().min(1, { message: 'CORS_ORIGIN is required' }),
  DATABASE_URL: z.string().min(1, { message: 'DATABASE_URL is required' }),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

export const env = envSchema.parse(process.env);
