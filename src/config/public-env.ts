import { publicEnvSchema } from "@/validations/env";

const parsed = publicEnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Public config should still be validated so wrong URLs are caught early without touching server secrets.
  const issues = parsed.error.flatten().fieldErrors;
  console.error("Public environment validation failed", issues);
  throw new Error("Invalid public environment variables");
}

export const publicEnv = parsed.data;