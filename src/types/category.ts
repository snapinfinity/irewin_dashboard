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
}

export type CategoryInput = Omit<Category, "id" | "createdAt">;
