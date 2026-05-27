import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { env } from "@/config/env";

type FirebaseAdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function getFirebaseAdminCredentials(): FirebaseAdminCredentials {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    throw new Error("Missing Firebase admin environment variables");
  }

  return {
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

// Firebase Admin stays on the server so privileged actions like OTP verification and user management remain secure.
// Keeping admin and client initialization separate avoids exposing service account credentials to the browser.
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0] as App;
  }

  const credentials = getFirebaseAdminCredentials();

  return initializeApp({
    credential: cert(credentials),
    projectId: credentials.projectId,
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export type { FirebaseAdminCredentials };