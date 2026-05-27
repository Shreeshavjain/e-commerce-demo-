import { publicEnv } from "@/config/public-env";

// Derived settings live here so server modules do not repeat URL and mode logic.
export const appConfig = {
  name: "Ecommerce",
  url: publicEnv.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;