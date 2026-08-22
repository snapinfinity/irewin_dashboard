// No "server-only" import guard here: this module is also loaded directly
// by scripts/seed-admin.ts as a plain Node script (outside Next's bundler),
// where server-only's package export condition doesn't apply and it throws
// unconditionally. Its only two importers (the list-admins API route and
// the seed script) are both legitimately server-side, so the guard added no
// real protection — nothing else in the app imports this file.
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

/**
 * Initialized lazily rather than at module load: `next build` collects page
 * data by importing route modules, and eager init would make the build fail
 * on any machine without service-account credentials. Callers hit this from
 * inside a request/script, where credentials are genuinely required.
 */
let cachedApp: App | undefined;

function getAdminApp(): App {
  cachedApp ??= createAdminApp();
  return cachedApp;
}

export function adminAuth() {
  return getAdminAuth(getAdminApp());
}

export function adminDb() {
  return getAdminFirestore(getAdminApp());
}
