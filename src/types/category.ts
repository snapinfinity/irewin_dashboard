import type { Timestamp } from "firebase/firestore";

export interface Subcategory {
  name: string;
  slug: string;
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
}

export type CategoryInput = Omit<Category, "id" | "createdAt">;
