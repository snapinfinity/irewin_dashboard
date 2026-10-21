import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { reviewConverter } from "@/lib/firebase/converters";
import type { Review, ReviewStatus } from "@/types/review";

const reviewsCol = () => collection(db, "reviews").withConverter(reviewConverter);

/** How many reviews one tab loads. Only these documents are read, however many reviews exist. */
export const REVIEWS_PAGE_SIZE = 50;

/**
 * The newest reviews with one status (status + updatedAt index in
 * firestore.indexes.json). Nothing is counted, so a visit reads at most
 * REVIEWS_PAGE_SIZE documents.
 */
export async function listReviews(status: ReviewStatus): Promise<Review[]> {
  const snap = await getDocs(
    query(reviewsCol(), where("status", "==", status), orderBy("updatedAt", "desc"), limit(REVIEWS_PAGE_SIZE)),
  );
  return snap.docs.map((d) => d.data());
}

/** Approve / reject (or move back to pending). Only approved reviews show on the public site. */
export async function setReviewStatus(id: string, status: ReviewStatus, staffUid: string): Promise<void> {
  await updateDoc(doc(db, "reviews", id), { status, reviewedAt: serverTimestamp(), reviewedBy: staffUid });
}

/** Permanent — Admin or above only (firestore.rules). The author can write a new one afterwards. */
export async function deleteReview(id: string): Promise<void> {
  await deleteDoc(doc(db, "reviews", id));
}
