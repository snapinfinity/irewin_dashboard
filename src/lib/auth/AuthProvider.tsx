"use client";

import { doc, getDoc } from "firebase/firestore";
import {
  type User,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { createContext, useEffect, useState, type ReactNode } from "react";
import { adminConverter } from "@/lib/firebase/converters";
import { auth, db, googleAuthProvider } from "@/lib/firebase/client";
import type { AdminUser } from "@/types/admin";

/**
 * `not-admin`     — signed in fine, but no admins/{uid} doc exists for them.
 * `rules-blocked` — Firestore refused the admins/{uid} read. Almost always
 *                   means firestore.rules hasn't been deployed to the project,
 *                   so the rules are still default-deny. Worth distinguishing:
 *                   it's a deployment problem, not a permissions decision.
 */
export type SignInFailureReason = "not-admin" | "rules-blocked";

export interface SignInResult {
  authorized: boolean;
  reason?: SignInFailureReason;
}

interface AuthContextValue {
  user: User | null;
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isOwner: boolean;
  isAdminOrAbove: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<SignInResult>;
  signInWithEmailPassword: (email: string, password: string) => Promise<SignInResult>;
  sendPasswordReset: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      try {
        if (firebaseUser) {
          const snap = await getDoc(
            doc(db, "admins", firebaseUser.uid).withConverter(adminConverter),
          );
          setAdminUser(snap.exists() ? snap.data() : null);
        } else {
          setAdminUser(null);
        }
      } catch (error) {
        // Never leave the app stuck on the loading spinner: if the admin
        // lookup fails (e.g. Firestore rules not deployed, offline), treat
        // the user as non-admin so the guard redirects them to /login.
        console.error("[auth] Could not read admins/{uid}:", error);
        setAdminUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Shared post-sign-in gate: an authenticated Firebase user is only let
   * into the app if an `admins/{uid}` doc already exists for them. That doc
   * can only be created by the seed script (Admin SDK), so this never
   * self-grants access regardless of which provider signed the user in.
   */
  async function authorizeSignedInUser(signedInUser: User): Promise<SignInResult> {
    let snap;
    try {
      snap = await getDoc(doc(db, "admins", signedInUser.uid).withConverter(adminConverter));
    } catch (error) {
      // A denied read here is a misconfiguration, not a rejected user — our
      // rules let a signed-in user read their own admin doc even when it
      // doesn't exist. Report it separately so the UI can say something useful
      // instead of a generic "sign-in failed".
      await firebaseSignOut(auth);
      setUser(null);
      setAdminUser(null);
      const code = (error as { code?: string })?.code;
      if (code === "permission-denied" || code === "missing-or-insufficient-permissions") {
        return { authorized: false, reason: "rules-blocked" };
      }
      throw error;
    }

    if (!snap.exists()) {
      await firebaseSignOut(auth);
      setUser(null);
      setAdminUser(null);
      return { authorized: false, reason: "not-admin" };
    }
    setAdminUser(snap.data());
    return { authorized: true };
  }

  async function signInWithGoogle(): Promise<SignInResult> {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return authorizeSignedInUser(result.user);
  }

  async function signInWithEmailPassword(email: string, password: string): Promise<SignInResult> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return authorizeSignedInUser(result.user);
  }

  async function sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        isAdmin: adminUser != null,
        isOwner: adminUser?.role === "owner",
        isAdminOrAbove: adminUser?.role === "owner" || adminUser?.role === "admin",
        loading,
        signInWithGoogle,
        signInWithEmailPassword,
        sendPasswordReset,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
