import { adminAuth, adminDb } from "@/lib/firebase/admin";
import type { AdminRole } from "@/types/admin";

export class AuthRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthRequestError";
    this.status = status;
  }
}

export interface VerifiedCaller {
  uid: string;
  email: string;
  role: AdminRole;
}

/**
 * Shared by every /api/admin/* route: verifies the bearer token identifies a
 * real signed-in Firebase user, then confirms an admins/{uid} doc exists for
 * them via the Admin SDK (bypassing Firestore rules, since this check IS the
 * authorization decision, not something rules can gate). Throws
 * AuthRequestError with the right HTTP status on any failure.
 */
export async function verifyCallerIsAdmin(request: Request): Promise<VerifiedCaller> {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    throw new AuthRequestError(401, "Missing bearer token");
  }

  let uid: string;
  try {
    uid = (await adminAuth().verifyIdToken(idToken)).uid;
  } catch (err) {
    // Logged server-side only: could be a genuinely bad/expired token, or the
    // Admin SDK itself failing to initialize (e.g. missing/malformed
    // FIREBASE_SERVICE_ACCOUNT_JSON on this deployment) — both throw here,
    // and distinguishing them from the response would leak internals to an
    // unauthenticated caller, so the client only ever sees "Invalid token".
    console.error("[verifyAdminRequest] Token verification failed:", err);
    throw new AuthRequestError(401, "Invalid token");
  }

  const doc = await adminDb().collection("admins").doc(uid).get();
  if (!doc.exists) {
    throw new AuthRequestError(403, "Not an admin");
  }

  const data = doc.data() as { email: string; role: AdminRole };
  return { uid, email: data.email, role: data.role };
}

/** Same as verifyCallerIsAdmin, but additionally requires role === 'owner'. */
export async function verifyCallerIsOwner(request: Request): Promise<VerifiedCaller> {
  const caller = await verifyCallerIsAdmin(request);
  if (caller.role !== "owner") {
    throw new AuthRequestError(403, "Only the Super Admin can perform this action");
  }
  return caller;
}

/** Same as verifyCallerIsAdmin, but additionally requires role 'owner' or 'admin'. */
export async function verifyCallerIsAdminOrAbove(request: Request): Promise<VerifiedCaller> {
  const caller = await verifyCallerIsAdmin(request);
  if (caller.role !== "owner" && caller.role !== "admin") {
    throw new AuthRequestError(403, "Only an Admin or the Super Admin can perform this action");
  }
  return caller;
}
