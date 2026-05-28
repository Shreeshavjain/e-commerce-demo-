import { getFirebaseAdminAuth } from "@/services/firebase/admin";
import type { VerifiedFirebaseToken } from "@/types/auth";

type DecodedFirebaseToken = Awaited<ReturnType<ReturnType<typeof getFirebaseAdminAuth>["verifyIdToken"]>>;

function getProviderFromToken(token: DecodedFirebaseToken): VerifiedFirebaseToken["provider"] {
  const providerId = token.firebase.sign_in_provider;

  if (providerId === "google.com") {
    return "google";
  }

  return "otp";
}

// The backend verifies Firebase tokens so the client never gets to decide who is authenticated.
// This protects the app from forged tokens and gives the server a trusted identity payload to work with.
export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseToken> {
  console.error("[auth][firebase-token] verifying Firebase ID token", {
    stage: "verify-id-token",
    hasIdToken: Boolean(idToken?.trim()),
    tokenLength: idToken?.length ?? 0,
  });

  try {
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);

    console.error("[auth][firebase-token] Firebase ID token verified", {
      stage: "verify-id-token",
      uid: decodedToken.uid,
      provider: decodedToken.firebase.sign_in_provider,
      hasPhoneNumber: Boolean(decodedToken.phone_number),
      hasEmail: Boolean(decodedToken.email),
    });

    return {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number ?? null,
      email: decodedToken.email ?? null,
      name: decodedToken.name ?? null,
      picture: decodedToken.picture ?? null,
      provider: getProviderFromToken(decodedToken),
    };
  } catch (error) {
    console.error("[auth][firebase-token] Firebase ID token verification failed", {
      stage: "verify-id-token",
      hasIdToken: Boolean(idToken?.trim()),
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
    });

    throw error;
  }
}