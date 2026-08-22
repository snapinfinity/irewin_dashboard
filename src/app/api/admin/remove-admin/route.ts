import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { AuthRequestError, verifyCallerIsAdminOrAbove } from "@/lib/firebase/verifyAdminRequest";
import type { AdminRole } from "@/types/admin";

interface RemoveAdminBody {
  uid?: unknown;
}

export async function POST(request: Request) {
  let caller;
  try {
    caller = await verifyCallerIsAdminOrAbove(request);
  } catch (err) {
    if (err instanceof AuthRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  let body: RemoveAdminBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const targetUid = typeof body.uid === "string" ? body.uid : "";
  if (!targetUid) {
    return NextResponse.json({ error: "uid is required" }, { status: 400 });
  }

  if (targetUid === caller.uid) {
    return NextResponse.json({ error: "You cannot remove your own admin access." }, { status: 400 });
  }

  const db = adminDb();
  const targetDoc = await db.collection("admins").doc(targetUid).get();
  if (!targetDoc.exists) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }
  const targetData = targetDoc.data() as { email?: string; role?: AdminRole };

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const targetEmail = (targetData.email ?? "").trim().toLowerCase();
  if (superAdminEmail && targetEmail === superAdminEmail) {
    return NextResponse.json({ error: "The Super Admin account cannot be removed." }, { status: 400 });
  }

  // An Admin may only remove Employees — removing another Admin is reserved
  // for the Super Admin. A Super Admin caller can remove anyone (subject to
  // the guards above).
  if (caller.role === "admin" && targetData.role !== "employee") {
    return NextResponse.json({ error: "Only the Super Admin can remove an Admin." }, { status: 403 });
  }

  // Revokes dashboard access only — the underlying Firebase Auth user (and
  // their ability to sign in) is left alone; that's a separate, more
  // destructive action nobody asked for.
  await targetDoc.ref.delete();

  return NextResponse.json({ removed: true });
}
