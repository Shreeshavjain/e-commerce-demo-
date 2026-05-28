import { NextResponse } from "next/server";
import { authLoginRequestSchema } from "@/validations/auth";
import { verifyFirebaseIdToken } from "@/services/auth/firebase-token";
import { syncFirebaseUser } from "@/services/auth/user-sync";
import { createAuthSession } from "@/server/auth/session";
import { createAuthErrorResponse, createAuthSuccessResponse } from "@/server/auth/auth-response";

export async function POST(request: Request) {
  let body: unknown = null;

  try {
    body = await request.json();
  } catch (error) {
    console.error("[auth][login] invalid JSON body", {
      stage: "parse-request-body",
      error: error instanceof Error ? error.message : String(error),
    });
  }

  const parsedBody = authLoginRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    console.error("[auth][login] rejected invalid login request", {
      stage: "validate-request-body",
      issues: parsedBody.error.flatten().fieldErrors,
    });

    return NextResponse.json(
      createAuthErrorResponse("Invalid login request", parsedBody.error.message),
      { status: 400 }
    );
  }

  let failureStage: "verify-firebase-token" | "sync-firebase-user" | "create-auth-session" = "verify-firebase-token";

  try {
    console.error("[auth][login] received login request", {
      stage: "request-received",
      hasIdToken: Boolean(parsedBody.data.idToken?.trim()),
      displayNameProvided: Boolean(parsedBody.data.displayName?.trim()),
    });

    // The backend verifies the Firebase token before trusting any user identity data.
    const verifiedToken = await verifyFirebaseIdToken(parsedBody.data.idToken);
    failureStage = "sync-firebase-user";

    // Existing users sign in immediately, while brand-new users are created after OTP verification and name capture.
    const { user, isNewUser } = await syncFirebaseUser({
      token: verifiedToken,
      displayName: parsedBody.data.displayName,
    });
    failureStage = "create-auth-session";

    // The verified token is exchanged for a secure session cookie so the browser never needs to store long-lived auth tokens.
    await createAuthSession(parsedBody.data.idToken);

    return NextResponse.json(
      createAuthSuccessResponse(
        user,
        isNewUser,
        isNewUser ? "Account created and signed in successfully" : "Signed in successfully"
      ),
      { status: isNewUser ? 201 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in";
    console.error("[auth][login] authentication failed", {
      stage: failureStage,
      reason: message,
      error: error instanceof Error ? { name: error.name, stack: error.stack } : String(error),
    });

    return NextResponse.json(createAuthErrorResponse("Authentication failed", message), {
      status: 401,
    });
  }
}