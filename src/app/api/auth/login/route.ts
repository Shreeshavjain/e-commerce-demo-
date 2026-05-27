import { NextResponse } from "next/server";
import { authLoginRequestSchema } from "@/validations/auth";
import { verifyFirebaseIdToken } from "@/services/auth/firebase-token";
import { syncFirebaseUser } from "@/services/auth/user-sync";
import { createAuthSession } from "@/server/auth/session";
import { createAuthErrorResponse, createAuthSuccessResponse } from "@/server/auth/auth-response";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsedBody = authLoginRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return NextResponse.json(
      createAuthErrorResponse("Invalid login request", parsedBody.error.message),
      { status: 400 }
    );
  }

  try {
    // The backend verifies the Firebase token before trusting any user identity data.
    const verifiedToken = await verifyFirebaseIdToken(parsedBody.data.idToken);

    // Existing users sign in immediately, while brand-new users are created after OTP verification and name capture.
    const { user, isNewUser } = await syncFirebaseUser({
      token: verifiedToken,
      displayName: parsedBody.data.displayName,
    });

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
    return NextResponse.json(createAuthErrorResponse("Authentication failed", message), {
      status: 401,
    });
  }
}