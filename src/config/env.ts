import { envSchema, type Env } from "@/validations/env";

let cachedEnv: Env | null = null;

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // Fail fast during boot so missing secrets are caught before a request hits MongoDB or a provider SDK.
    const issues = parsed.error.flatten().fieldErrors;
    console.error("Environment validation failed", issues);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env: Env = cachedEnv ?? parseEnv();

if (cachedEnv === null) {
  cachedEnv = env;
}