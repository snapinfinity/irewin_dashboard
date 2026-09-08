import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { companyConverter } from "@/lib/firebase/converters";
import type { Company, CompanyInput } from "@/types/company";

const companiesCol = () => collection(db, "companies").withConverter(companyConverter);

async function fetchAllCompanies(): Promise<Company[]> {
  const snap = await getDocs(query(companiesCol(), orderBy("name", "asc")));
  return snap.docs.map((d) => d.data());
}

export async function listCompanies(): Promise<Company[]> {
  return (await fetchAllCompanies()).filter((c) => !c.isDeleted);
}

export async function getDeletedCompanies(): Promise<Company[]> {
  return (await fetchAllCompanies()).filter((c) => c.isDeleted);
}

export async function getCompanyById(id: string): Promise<Company | null> {
  const snap = await getDoc(doc(db, "companies", id).withConverter(companyConverter));
  return snap.exists() ? snap.data() : null;
}

export async function createCompany(input: CompanyInput): Promise<string> {
  const ref = await addDoc(collection(db, "companies"), {
    ...input,
    isDeleted: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCompany(id: string, patch: Partial<CompanyInput>): Promise<void> {
  await updateDoc(doc(db, "companies", id), { ...patch });
}

export async function deleteCompany(id: string): Promise<void> {
  await updateDoc(doc(db, "companies", id), { isDeleted: true, deletedAt: serverTimestamp() });
}

export async function restoreCompany(id: string): Promise<void> {
  await updateDoc(doc(db, "companies", id), { isDeleted: false, deletedAt: null });
}

export async function uploadCompanyLogo(companyId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png";
  const path = `company-logos/${companyId}-${Date.now()}.${ext}`;
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return getDownloadURL(ref);
}

export async function deleteCompanyLogo(logoURL: string): Promise<void> {
  try {
    const ref = storageRef(storage, logoURL);
    await deleteObject(ref);
  } catch {
    // logo may already be gone or URL not a storage ref; non-fatal.
  }
}
