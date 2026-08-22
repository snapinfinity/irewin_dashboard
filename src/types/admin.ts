import type { Timestamp } from "firebase/firestore";

export type AdminRole = "owner" | "admin";

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  photoURL: string | null;
  role: AdminRole;
  createdAt: Timestamp;
}
