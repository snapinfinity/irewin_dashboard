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

interface AuthContextValue {
  user: User | null;
  adminUser: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<{ authorized: boolean }>;
  signInWithEmailPassword: (email: string, password: string) => Promise<{ authorized: boolean }>;
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
      if (firebaseUser) {
        const snap = await getDoc(
          doc(db, "admins", firebaseUser.uid).withConverter(adminConverter),
        );
        setAdminUser(snap.exists() ? snap.data() : null);
      } else {
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
  async function authorizeSignedInUser(signedInUser: User): Promise<{ authorized: boolean }> {
    const snap = await getDoc(
      doc(db, "admins", signedInUser.uid).withConverter(adminConverter),
    );
    if (!snap.exists()) {
      await firebaseSignOut(auth);
      setUser(null);
      setAdminUser(null);
      return { authorized: false };
    }
    setAdminUser(snap.data());
    return { authorized: true };
  }

  async function signInWithGoogle(): Promise<{ authorized: boolean }> {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return authorizeSignedInUser(result.user);
  }

  async function signInWithEmailPassword(email: string, password: string): Promise<{ authorized: boolean }> {
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
