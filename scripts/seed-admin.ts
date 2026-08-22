import { config } from "dotenv";

config({ path: ".env.local" });

const { adminAuth, adminDb } = await import("../src/lib/firebase/admin");

async function main() {
  const emails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  if (emails.length === 0) {
    console.error("No ADMIN_EMAILS set. Add a comma-separated list of emails to .env.local and re-run.");
    process.exit(1);
  }

  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  const results: { email: string; status: string }[] = [];

  for (const email of emails) {
    let userRecord;
    let createdNewAccount = false;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch {
      // No existing Firebase Auth user (neither Google sign-in nor email/password).
      if (defaultPassword) {
        try {
          userRecord = await adminAuth.createUser({ email, password: defaultPassword });
          createdNewAccount = true;
        } catch (err) {
          results.push({ email, status: `FAILED to create user — ${(err as Error).message}` });
          continue;
        }
      } else {
        results.push({
          email,
          status:
            "SKIPPED — no Firebase Auth user found. Either have this person sign in once via /login (Google), or set ADMIN_DEFAULT_PASSWORD and re-run to create an email/password account for them.",
        });
        continue;
      }
    }

    await adminDb
      .collection("admins")
      .doc(userRecord.uid)
      .set(
        {
          uid: userRecord.uid,
          email: userRecord.email ?? email,
          name: userRecord.displayName ?? "",
          photoURL: userRecord.photoURL ?? null,
          role: "owner",
          createdAt: new Date(),
        },
        { merge: true },
      );
    results.push({ email, status: createdNewAccount ? "granted (new account, default password)" : "granted" });
  }

  console.table(results);
  if (defaultPassword) {
    console.log(
      "\nAny newly created accounts use ADMIN_DEFAULT_PASSWORD — have that admin sign in once and use \"Forgot password?\" to set their own.",
    );
  }
  process.exit(0);
}

main();
