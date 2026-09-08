import type { Timestamp } from "firebase/firestore";

export interface Subcategory {
  name: string;
  slug: string;
  /** Soft-deleted in place (not spliced out) so it can be restored inline. Absent means not deleted. */
  isDeleted?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  subcategories: Subcategory[];
  createdAt: Timestamp;
  /** uid of the admin/employee who created it — lets an Employee edit only their own. */
  createdBy: string;
  isDeleted: boolean;
  deletedAt: Timestamp | null;
}

export type CategoryInput = Omit<Category, "id" | "createdAt" | "isDeleted" | "deletedAt">;
