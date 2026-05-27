import { cookies } from "next/headers";
import { getFirebaseAdminAuth } from "@/services/firebase/admin";
import { env } from "@/config/env";

const SESSION_COOKIE_NAME = "__session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;

function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  };
}

// A server-issued session cookie is more scalable than keeping raw Firebase ID tokens in the browser.
// The client signs in once, the backend verifies the token, and the backend then creates a short-lived secure session.
export async function createAuthSession(idToken: string) {
  const sessionCookie = await getFirebaseAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_DURATION_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, getSessionCookieOptions());

  return sessionCookie;
}

export async function verifyAuthSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  return getFirebaseAdminAuth().verifySessionCookie(sessionCookie, true);
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
}