import "server-only";

import { existsSync, readFileSync } from "node:fs";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminFirestore } from "firebase-admin/firestore";

function loadServiceAccount(): Record<string, unknown> {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH ?? "./service-account.json";
  if (!existsSync(/* turbopackIgnore: true */ keyPath)) {
    throw new Error(
      `Firebase service account credentials not found. Set FIREBASE_SERVICE_ACCOUNT_JSON or place a service account key at "${keyPath}" (see .env.local.example).`,
    );
  }
  return JSON.parse(readFileSync(/* turbopackIgnore: true */ keyPath, "utf-8"));
}

function createAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];

  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
  if (useEmulators) {
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project" });
  }

  const serviceAccount = loadServiceAccount();
  return initializeApp({ credential: cert(serviceAccount) });
}

export const adminApp = createAdminApp();
export const adminAuth = getAdminAuth(adminApp);
export const adminDb = getAdminFirestore(adminApp);
