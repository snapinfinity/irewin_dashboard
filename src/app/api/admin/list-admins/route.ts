import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const callerDoc = await adminDb.collection("admins").doc(uid).get();
  if (!callerDoc.exists) {
    return NextResponse.json({ error: "Not an admin" }, { status: 403 });
  }

  const snapshot = await adminDb.collection("admins").orderBy("createdAt", "asc").get();
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
