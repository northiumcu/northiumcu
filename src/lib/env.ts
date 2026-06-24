import { z } from "zod";

/**
 * Environment validation — Phase 4 Foundation
 * Required vars are enforced in production; optional in development for clean local compile.
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
  PLAID_CLIENT_ID: optionalString(),
  PLAID_SECRET: optionalString(),
  PLAID_ENV: z.enum(["sandbox", "development", "production"]).optional(),
  STRIPE_SECRET_KEY: optionalString(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString(),
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

export const env = validateEnv();

export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
