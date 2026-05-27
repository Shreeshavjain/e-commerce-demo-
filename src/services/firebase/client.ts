"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { publicEnv } from "@/config/public-env";

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
};

function getFirebaseClientConfig(): FirebaseClientConfig {
  if (!publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY || !publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || !publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID) {
    throw new Error("Missing Firebase client environment variables");
  }

  return {
    apiKey: publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: publicEnv.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    storageBucket: publicEnv.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  };
}

// The client SDK is used in the browser for sign-in flows like phone OTP and future Google auth.
// We keep it separate from Firebase Admin so browser code never receives privileged credentials.
export function getFirebaseClientApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }

  return initializeApp(getFirebaseClientConfig());
}

export function getFirebaseClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

export type { FirebaseClientConfig };