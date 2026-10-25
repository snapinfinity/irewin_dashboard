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
import { db } from "@/lib/firebase/client";
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

// Logos are stored inline on the company doc (and copied onto its jobs) as a
// small data URL, so the project needs no Firebase Storage bucket. They're
// shown at most ~56px wide, so 160px covers 2x screens.
const LOGO_MAX_SIDE = 160;
// Firestore docs cap at 1 MiB; keep logos far below that.
const LOGO_MAX_CHARS = 150_000;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("That file couldn't be read as an image."));
    img.src = src;
  });
}

export async function encodeCompanyLogo(file: File): Promise<string> {
  const objectURL = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectURL);
    // SVGs without width/height attributes report 0x0.
    const width = img.naturalWidth || LOGO_MAX_SIDE;
    const height = img.naturalHeight || LOGO_MAX_SIDE;
    const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(width, height));

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser couldn't process the image.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // WebP keeps transparency and is small; browsers without WebP encoding
    // silently return PNG instead.
    let dataURL = canvas.toDataURL("image/webp", 0.9);
    if (!dataURL.startsWith("data:image/webp")) dataURL = canvas.toDataURL("image/png");
    if (dataURL.length > LOGO_MAX_CHARS) {
      throw new Error("This logo is too detailed to store. Try a simpler or smaller image.");
    }
    return dataURL;
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}
