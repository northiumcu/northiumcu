import { z } from "zod";

/**
 * Environment validation — Phase 4 Foundation
 * Middleware reads process.env directly (no throw). Full validation is lazy for server routes.
 */

function optionalString() {
  return z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined));
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .pipe(z.string().url().optional()),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString(),
  SUPABASE_SERVICE_ROLE_KEY: optionalString(),
  AUTH_ENCRYPTION_KEY: optionalString(),
  RESEND_API_KEY: optionalString(),
  RESEND_FROM_EMAIL: optionalString(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment configuration.");
  }

  const env = parsed.data;
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (env.NODE_ENV === "production" && !isBuildPhase) {
    const requiredInProduction = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ] as const;

    for (const key of requiredInProduction) {
      if (!env[key]) {
        throw new Error(
          `Missing required environment variable in production: ${key}`
        );
      }
    }
  }

  return env;
}

let cachedEnv: Env | undefined;

/** Lazy validation — safe for middleware; do not call at module load time. */
export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}

/** Edge-safe: never throws during middleware module initialization. */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/** Server-only startup check (layout, API routes). */
export function assertProductionEnv(): void {
  if (process.env.NODE_ENV === "production") {
    getEnv();
  }
}
