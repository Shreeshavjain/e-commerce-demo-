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
  const decodedToken = await getFirebaseAdminAuth().verifyIdToken(idToken);

  return {
    uid: decodedToken.uid,
    phoneNumber: decodedToken.phone_number ?? null,
    email: decodedToken.email ?? null,
    name: decodedToken.name ?? null,
    picture: decodedToken.picture ?? null,
    provider: getProviderFromToken(decodedToken),
  };
}