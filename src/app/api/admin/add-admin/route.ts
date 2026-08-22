import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { NoExistingAuthUserError, provisionAdmin } from "@/lib/firebase/adminProvisioning";
import { AuthRequestError, verifyCallerIsAdminOrAbove } from "@/lib/firebase/verifyAdminRequest";
import type { AdminRole } from "@/types/admin";

interface AddAdminBody {
  email?: unknown;
  name?: unknown;
  password?: unknown;
  role?: unknown;
}

// Never 'owner' — that's only ever minted by scripts/seed-admin.ts. Both
// Admin and Super Admin callers can grant either of these two, per the
// confirmed permission matrix (an Admin can create peer Admins).
const GRANTABLE_ROLES: AdminRole[] = ["admin", "employee"];

export async function POST(request: Request) {
  try {
    await verifyCallerIsAdminOrAbove(request);
  } catch (err) {
    if (err instanceof AuthRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  let body: AddAdminBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : undefined;
  const password = typeof body.password === "string" && body.password.length > 0 ? body.password : undefined;
  const role = body.role as AdminRole;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }
  if (password && password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }
  // Validated against an explicit allowlist, not just "not owner" — so this
  // can never be tricked into granting a role that doesn't exist either.
  if (!GRANTABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "role must be 'admin' or 'employee'" }, { status: 400 });
  }

  try {
    const result = await provisionAdmin(adminAuth(), adminDb(), {
      email,
      role,
      password,
      displayName: name,
    });
    return NextResponse.json({ admin: result });
  } catch (err) {
    if (err instanceof NoExistingAuthUserError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add admin" }, { status: 500 });
  }
}
