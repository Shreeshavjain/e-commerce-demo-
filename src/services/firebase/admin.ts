import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { env } from "@/config/env";

type FirebaseAdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function getMissingFirebaseAdminEnvKeys() {
  const missingKeys: string[] = [];

  if (!env.FIREBASE_PROJECT_ID) {
    missingKeys.push("FIREBASE_PROJECT_ID");
  }

  if (!env.FIREBASE_CLIENT_EMAIL) {
    missingKeys.push("FIREBASE_CLIENT_EMAIL");
  }

  if (!env.FIREBASE_PRIVATE_KEY) {
    missingKeys.push("FIREBASE_PRIVATE_KEY");
  }

  return missingKeys;
}

function getFirebaseAdminCredentials(): FirebaseAdminCredentials {
  const missingKeys = getMissingFirebaseAdminEnvKeys();

  if (missingKeys.length > 0) {
    console.error("[auth][firebase-admin] missing required admin env vars", {
      stage: "get-firebase-admin-credentials",
      missingKeys,
    });

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
    console.error("[auth][firebase-admin] reusing initialized Firebase Admin app", {
      stage: "get-firebase-admin-app",
      appCount: getApps().length,
      reused: true,
    });

    return getApps()[0] as App;
  }

  console.error("[auth][firebase-admin] initializing Firebase Admin app", {
    stage: "get-firebase-admin-app",
    appCount: getApps().length,
    reused: false,
  });

  const credentials = getFirebaseAdminCredentials();

  try {
    const app = initializeApp({
      credential: cert(credentials),
      projectId: credentials.projectId,
    });

    console.error("[auth][firebase-admin] Firebase Admin app initialized", {
      stage: "get-firebase-admin-app",
      appName: app.name,
    });

    return app;
  } catch (error) {
    console.error("[auth][firebase-admin] Firebase Admin app initialization failed", {
      stage: "get-firebase-admin-app",
      error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
    });

    throw error;
  }
}

export function getFirebaseAdminAuth(): Auth {
  const app = getFirebaseAdminApp();
  const auth = getAuth(app);

  console.error("[auth][firebase-admin] resolved Firebase Admin auth instance", {
    stage: "get-firebase-admin-auth",
    appName: app.name,
  });

  return auth;
}

export type { FirebaseAdminCredentials };