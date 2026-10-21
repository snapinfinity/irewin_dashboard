import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { reviewConverter } from "@/lib/firebase/converters";
import type { Review, ReviewStatus } from "@/types/review";

const reviewsCol = () => collection(db, "reviews").withConverter(reviewConverter);

/** Every review, newest activity first. The page splits them by status. */
export async function listReviews(): Promise<Review[]> {
  const snap = await getDocs(query(reviewsCol(), orderBy("updatedAt", "desc")));
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
