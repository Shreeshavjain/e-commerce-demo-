import type { AuthErrorResponse, AuthResponse, AuthenticatedUser } from "@/types/auth";
import type { AuthLoginRequest } from "@/validations/auth";

type AuthEndpointResult = AuthResponse | AuthErrorResponse;

async function readJsonResponse<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function requestAuthEndpoint<T extends { success: boolean; message: string }>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = await readJsonResponse<T>(response);

  if (!response.ok || !payload) {
    const errorMessage = payload && "message" in payload ? payload.message : "Unable to complete the auth request";
    throw new Error(errorMessage);
  }

  if (!payload.success) {
    throw new Error(payload.message);
  }

  return payload;
}

// The browser only sends the verified Firebase token to the backend; the backend decides whether the account is new
// and is responsible for creating the secure session cookie.
export async function submitAuthLogin(payload: AuthLoginRequest): Promise<AuthResponse> {
  return requestAuthEndpoint<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// Session restoration reads the cookie-backed backend session instead of relying on a fragile client-side auth guess.
export async function restoreAuthSession(): Promise<AuthenticatedUser | null> {
  const response = await fetch("/api/auth/session", {
    credentials: "include",
    cache: "no-store",
  });

  if (response.status === 401) {
    return null;
  }

  const payload = await readJsonResponse<AuthEndpointResult>(response);

  if (!response.ok || !payload || !payload.success) {
    return null;
  }

  return payload.user;
}

export async function submitAuthLogout(): Promise<void> {
  await requestAuthEndpoint<{ success: true; message: string }>("/api/auth/logout", {
    method: "POST",
  });
}