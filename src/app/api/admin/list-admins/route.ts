import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { AuthRequestError, verifyCallerIsAdmin } from "@/lib/firebase/verifyAdminRequest";

export async function GET(request: Request) {
  try {
    await verifyCallerIsAdmin(request);
  } catch (err) {
    if (err instanceof AuthRequestError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }

  const snapshot = await adminDb().collection("admins").orderBy("createdAt", "asc").get();
  const admins = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email,
      name: data.name,
      photoURL: data.photoURL ?? null,
      role: data.role,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? null,
    };
  });

  return NextResponse.json({ admins });
}
