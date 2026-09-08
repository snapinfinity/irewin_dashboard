import type { Timestamp } from "firebase/firestore";

export interface Company {
  id: string;
  name: string;
  logoURL: string | null;
  website: string | null;
  createdAt: Timestamp;
  /** uid of the admin/employee who created it — lets an Employee edit only their own. */
  createdBy: string;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
}

export type CompanyInput = Omit<Company, "id" | "createdAt" | "isDeleted" | "deletedAt">;
