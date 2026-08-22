import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  // Deferred until after dotenv has populated process.env, since
  // lib/firebase/admin.ts reads env vars (emulator flag, project id) at
  // import time. A top-level await here would also break tsx's default CJS
  // transform, which doesn't support top-level await.
  const { adminAuth: getAuthClient, adminDb: getDbClient } = await import("../src/lib/firebase/admin");
  const { provisionAdmin, NoExistingAuthUserError } = await import("../src/lib/firebase/adminProvisioning");

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();

  const emails = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );

  // A misconfigured ADMIN_EMAILS must never leave the project with zero
  // owners: if SUPER_ADMIN_EMAIL is set, it's always processed even if
  // someone forgot to list it in ADMIN_EMAILS too.
  if (superAdminEmail) {
    emails.add(superAdminEmail);
  }

  if (emails.size === 0) {
    console.error("No ADMIN_EMAILS or SUPER_ADMIN_EMAIL set. Add at least one to .env.local and re-run.");
    process.exit(1);
  }

  const adminAuth = getAuthClient();
  const adminDb = getDbClient();
  const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;

  const results: { email: string; role: string; status: string }[] = [];

  for (const email of emails) {
    const role = email === superAdminEmail ? "owner" : "admin";
    try {
      const { createdNewAuthUser } = await provisionAdmin(adminAuth, adminDb, {
        email,
        role,
        password: defaultPassword,
      });
      results.push({
        email,
        role,
        status: createdNewAuthUser ? "granted (new account, default password)" : "granted",
      });
    } catch (err) {
      if (err instanceof NoExistingAuthUserError) {
        results.push({
          email,
          role,
          status:
            "SKIPPED — no Firebase Auth user found. Either have this person sign in once via /login (Google), or set ADMIN_DEFAULT_PASSWORD and re-run to create an email/password account for them.",
        });
      } else {
        results.push({ email, role, status: `FAILED — ${(err as Error).message}` });
      }
    }
  }

  console.table(results);
  if (!superAdminEmail) {
    console.log("\nNo SUPER_ADMIN_EMAIL set — every account above was granted role 'admin' (sub-admin), not 'owner'.");
  }
  if (defaultPassword) {
    console.log(
      "Any newly created accounts use ADMIN_DEFAULT_PASSWORD — have that admin sign in once and use \"Forgot password?\" to set their own.",
    );
  }
  process.exit(0);
}

main();
