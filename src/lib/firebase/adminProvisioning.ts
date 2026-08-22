import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import type { AdminRole } from "@/types/admin";

export class NoExistingAuthUserError extends Error {
  constructor(email: string) {
    super(
      `No Firebase Auth user exists for ${email} and no password was provided. Either have them sign in with Google at /login once first, or supply a password to create an email/password account for them.`,
    );
    this.name = "NoExistingAuthUserError";
  }
}

export interface ProvisionAdminParams {
  email: string;
  role: AdminRole;
  /** Only used if no Firebase Auth user exists yet for this email. */
  password?: string;
  /** Only used if no Firebase Auth user exists yet for this email. */
  displayName?: string;
}

export interface ProvisionAdminResult {
  uid: string;
  email: string;
  createdNewAuthUser: boolean;
}

/**
 * Shared by scripts/seed-admin.ts (initial Super Admin bootstrap) and
 * POST /api/admin/add-admin (owner-triggered sub-admin creation): resolve or
 * create the Firebase Auth user for `email`, then create/overwrite their
 * admins/{uid} doc with `role`. Both callers already verified the caller is
 * authorized to grant `role` before reaching this function — it does not
 * re-check permissions itself, since it runs entirely through the Admin SDK
 * (bypassing Firestore rules) and trusts its caller.
 */
export async function provisionAdmin(
  adminAuth: Auth,
  adminDb: Firestore,
  params: ProvisionAdminParams,
): Promise<ProvisionAdminResult> {
  const { email, role, password, displayName } = params;

  let userRecord;
  let createdNewAuthUser = false;
  try {
    userRecord = await adminAuth.getUserByEmail(email);
  } catch {
    if (!password) {
      throw new NoExistingAuthUserError(email);
    }
    userRecord = await adminAuth.createUser({ email, password, displayName });
    createdNewAuthUser = true;
  }

  await adminDb
    .collection("admins")
    .doc(userRecord.uid)
    .set(
      {
        uid: userRecord.uid,
        email: userRecord.email ?? email,
        name: displayName ?? userRecord.displayName ?? "",
        photoURL: userRecord.photoURL ?? null,
        role,
        createdAt: new Date(),
      },
      { merge: true },
    );

  return { uid: userRecord.uid, email: userRecord.email ?? email, createdNewAuthUser };
}
