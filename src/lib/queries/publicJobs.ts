import { collection, getDocs, limit as fbLimit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { jobConverter } from "@/lib/firebase/converters";

/**
 * Distinct locations for the public filter dropdown, derived from a bounded
 * sample of published jobs (Firestore has no native DISTINCT query).
 */
export async function getPublicLocations(maxDocs = 500): Promise<string[]> {
  const snap = await getDocs(
    query(collection(db, "jobs").withConverter(jobConverter), where("status", "==", "published"), fbLimit(maxDocs)),
  );
  const locations = new Set<string>();
  snap.docs.forEach((d) => locations.add(d.data().location));
  return Array.from(locations).sort();
}
