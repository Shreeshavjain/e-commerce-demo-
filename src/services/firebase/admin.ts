import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { firebaseAdminEnvSchema } from "@/validations/env";

type FirebaseAdminCredentials = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function logFirebaseAdminLifecycle(message: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.log(message, details);
  }
}

function getFirebaseAdminCredentials(): FirebaseAdminCredentials {
  const parsed = firebaseAdminEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const missingKeys = Object.keys(parsed.error.flatten().fieldErrors);

    console.error("[auth][firebase-admin] missing required admin env vars", {
      stage: "get-firebase-admin-credentials",
      missingKeys,
    });

    throw new Error("Missing Firebase admin environment variables");
  }

  return {
    projectId: parsed.data.FIREBASE_PROJECT_ID,
    clientEmail: parsed.data.FIREBASE_CLIENT_EMAIL,
    privateKey: parsed.data.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

// Firebase Admin stays on the server so privileged actions like OTP verification and user management remain secure.
// Keeping admin and client initialization separate avoids exposing service account credentials to the browser.
export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    logFirebaseAdminLifecycle("[auth][firebase-admin] reusing initialized Firebase Admin app", {
      stage: "get-firebase-admin-app",
      appCount: getApps().length,
      reused: true,
    });

    return getApps()[0] as App;
  }

  logFirebaseAdminLifecycle("[auth][firebase-admin] initializing Firebase Admin app", {
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

    logFirebaseAdminLifecycle("[auth][firebase-admin] Firebase Admin app initialized", {
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

  logFirebaseAdminLifecycle("[auth][firebase-admin] resolved Firebase Admin auth instance", {
    stage: "get-firebase-admin-auth",
    appName: app.name,
  });

  return auth;
}

export type { FirebaseAdminCredentials };