import type { Timestamp } from "firebase/firestore";

export type ReviewStatus = "pending" | "approved" | "rejected";

/**
 * A customer review written on the public IREWIN site. Doc id = the author's
 * uid (one review per account). New and edited reviews arrive as "pending";
 * only "approved" ones are shown on the public site.
 */
export interface Review {
  id: string;
  uid: string;
  name: string;
  photoURL: string | null;
  rating: number;
  text: string;
  status: ReviewStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  /** Set when a staff member approves/rejects it. */
  reviewedAt?: Timestamp | null;
  reviewedBy?: string | null;
}
