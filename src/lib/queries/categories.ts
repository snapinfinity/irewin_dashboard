import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { categoryConverter } from "@/lib/firebase/converters";
import { slugify } from "@/lib/utils/slugify";
import type { Category, CategoryInput } from "@/types/category";

const categoriesCol = () => collection(db, "categories").withConverter(categoryConverter);

export async function listCategories(): Promise<Category[]> {
  const snap = await getDocs(query(categoriesCol(), orderBy("name", "asc")));
  return snap.docs.map((d) => d.data());
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const snap = await getDoc(doc(db, "categories", slug).withConverter(categoryConverter));
  return snap.exists() ? snap.data() : null;
}

export async function createCategory(input: CategoryInput): Promise<string> {
  const slug = input.slug || slugify(input.name);
  await setDoc(doc(db, "categories", slug), {
    ...input,
    slug,
    createdAt: serverTimestamp(),
  });
  return slug;
}

export async function updateCategory(slug: string, patch: Partial<CategoryInput>): Promise<void> {
  await updateDoc(doc(db, "categories", slug), { ...patch });
}

export async function setCategoryEnabled(slug: string, enabled: boolean): Promise<void> {
  await updateDoc(doc(db, "categories", slug), { enabled });
}

export async function deleteCategory(slug: string): Promise<void> {
  await deleteDoc(doc(db, "categories", slug));
}
