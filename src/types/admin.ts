import type { Timestamp } from "firebase/firestore";

/**
 * "owner" is the Super Admin (full access, only role that can remove another
 * Admin, and the only role scripts/seed-admin.ts can mint). "admin" can add
 * Admins/Employees and has full CRUD (including delete) on jobs/categories/
 * companies. "employee" can create and edit their own jobs/categories/
 * companies but never delete anything and never touch other people's entries.
 */
export type AdminRole = "owner" | "admin" | "employee";

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  role: AdminRole;
  createdAt: Timestamp;
}
