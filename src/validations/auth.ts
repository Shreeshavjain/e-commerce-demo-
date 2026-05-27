import { z } from "zod";

export const authLoginRequestSchema = z.object({
  idToken: z.string().min(1, "Firebase ID token is required"),
  displayName: z.string().trim().min(1).max(120).optional(),
});

export type AuthLoginRequest = z.infer<typeof authLoginRequestSchema>;