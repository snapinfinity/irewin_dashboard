import { NextResponse } from "next/server";

/**
 * Firebase's client SDK persists auth state in IndexedDB, not a cookie, so
 * this edge proxy has no way to see whether a request is authenticated
 * without a server-side session-cookie exchange (out of scope for v1). The
 * real access gate is client-side in `admin/layout.tsx` (redirects
 * unauthenticated/non-admin users to /login) backed by Firestore Security
 * Rules, which are the actual enforcement boundary for data access. This
 * is a documented no-op placeholder, not a security control.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
