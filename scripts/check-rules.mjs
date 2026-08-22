/**
 * Verifies that the deployed Firestore security rules match firestore.rules,
 * by probing the live project as an anonymous (logged-out) client.
 *
 *   npm run check:rules
 *
 * The most common failure this catches: rules were never deployed, so the
 * project is still default-deny and the app can't even read admins/{uid}
 * after a successful sign-in — which looks like "login is broken".
 */
import { config } from "dotenv";
import { initializeApp } from "firebase/app";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  where,
} from "firebase/firestore";

config({ path: ".env.local" });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId) {
  console.error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set in .env.local");
  process.exit(1);
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true") {
  console.error("This checks a LIVE project, but NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true.");
  process.exit(1);
}

const db = getFirestore(
  initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }),
);

async function probe(label, want, fn) {
  let got;
  try {
    await fn();
    got = "allow";
  } catch (err) {
    got = err?.code === "permission-denied" ? "deny" : `error(${err?.code ?? err?.message})`;
  }
  const ok = got === want;
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}  (want ${want}, got ${got})`);
  return ok;
}

console.log(`\nProbing "${projectId}" as an anonymous client...\n`);

const results = [
  await probe("anonymous read /categories", "allow", () => getDocs(collection(db, "categories"))),
  await probe("anonymous read published /jobs", "allow", () =>
    getDocs(query(collection(db, "jobs"), where("status", "==", "published"), limit(1))),
  ),
  await probe("anonymous read /companies", "allow", () => getDocs(collection(db, "companies"))),
  await probe("anonymous read ALL /jobs (drafts must not leak)", "deny", () =>
    getDocs(query(collection(db, "jobs"), limit(1))),
  ),
  await probe("anonymous read /admins/{uid}", "deny", () => getDoc(doc(db, "admins", "probe-not-a-real-uid"))),
];

const failed = results.filter((r) => !r).length;
console.log();

if (failed === 0) {
  console.log("All checks passed — deployed rules match firestore.rules.\n");
  process.exit(0);
}

if (!results[0] && !results[1] && !results[2]) {
  console.log("Rules look DEFAULT-DENY: firestore.rules is probably not deployed.");
  console.log("Fix: npx firebase-tools deploy --only firestore:rules  (after `firebase login`)");
  console.log("     or paste firestore.rules into Firebase console -> Firestore -> Rules -> Publish.\n");
} else if (!results[3]) {
  console.log("Rules are TOO OPEN — anonymous users can read draft jobs (test mode?).");
  console.log("Fix: deploy firestore.rules to replace the permissive test rules.\n");
} else {
  console.log(`${failed} check(s) failed — compare the deployed rules against firestore.rules.\n`);
}
process.exit(1);
