import {
  collection,
  doc,
  type DocumentSnapshot,
  getCountFromServer,
  getDoc,
  getDocs,
  increment,
  limit as fbLimit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  type QueryConstraint,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { jobConverter } from "@/lib/firebase/converters";
import { buildSearchKeywords, normalizeSearchTerm } from "@/lib/utils/searchKeywords";
import { EMPLOYMENT_TYPE_VALUES, JOBS_PAGE_SIZE } from "@/lib/constants";
import { slugify } from "@/lib/utils/slugify";
import type {
  EmploymentType,
  ExperienceLevel,
  Job,
  JobInput,
  JobStatus,
  WorkMode,
} from "@/types/job";

const jobsCol = () => collection(db, "jobs").withConverter(jobConverter);

// Doc ID = slugify(location) rather than the raw location as a map-field key,
// to sidestep Firestore field-path pitfalls (e.g. a location containing a
// literal "." would otherwise be misread as a nested-field path).
const locationStatsRef = (location: string) => doc(db, "jobLocationStats", slugify(location));

export interface JobFilters {
  status?: JobStatus;
  category?: string;
  subcategory?: string;
  location?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  searchTerm?: string;
}

export type JobSortField = "createdAt" | "updatedAt" | "titleLower" | "applicationDeadline" | "salaryMin";

export interface JobsPageResult {
  jobs: Job[];
  firstDoc: DocumentSnapshot | null;
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

function buildConstraints(filters: JobFilters): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (filters.status) constraints.push(where("status", "==", filters.status));
  if (filters.category) constraints.push(where("category", "==", filters.category));
  if (filters.subcategory) constraints.push(where("subcategory", "==", filters.subcategory));
  if (filters.location) constraints.push(where("location", "==", filters.location));
  if (filters.workMode) constraints.push(where("workMode", "==", filters.workMode));
  if (filters.employmentType) constraints.push(where("employmentType", "==", filters.employmentType));
  if (filters.experienceLevel) constraints.push(where("experienceLevel", "==", filters.experienceLevel));
  if (filters.searchTerm) {
    const token = normalizeSearchTerm(filters.searchTerm);
    if (token) constraints.push(where("searchKeywords", "array-contains", token));
  }
  return constraints;
}

export async function getJobsPage(options: {
  filters?: JobFilters;
  sortField?: JobSortField;
  sortDirection?: "asc" | "desc";
  pageSize?: number;
  cursor?: DocumentSnapshot | null;
}): Promise<JobsPageResult> {
  const {
    filters = {},
    sortField = "updatedAt",
    sortDirection = "desc",
    pageSize = JOBS_PAGE_SIZE,
    cursor = null,
  } = options;

  const constraints = buildConstraints(filters);
  constraints.push(orderBy(sortField, sortDirection));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(fbLimit(pageSize + 1));

  const snap = await getDocs(query(jobsCol(), ...constraints));
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const pageDocs = hasMore ? docs.slice(0, pageSize) : docs;

  // Soft-deleted jobs are filtered out here rather than via a Firestore
  // where("isDeleted","==",false) constraint, which would need every one of
  // the composite indexes above to gain an isDeleted prefix. Trade-off: a
  // page can show fewer than `pageSize` rows when trashed docs are
  // interspersed in this window — acceptable for an admin list.
  const jobs = pageDocs.map((d) => d.data()).filter((j) => !j.isDeleted);

  return {
    jobs,
    firstDoc: pageDocs[0] ?? null,
    lastDoc: pageDocs[pageDocs.length - 1] ?? null,
    hasMore,
  };
}

export async function getJobById(id: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, "jobs", id).withConverter(jobConverter));
  return snap.exists() ? snap.data() : null;
}

export async function createJob(
  input: JobInput & { companyName: string; companyLogoURL: string | null; categoryName: string; subcategoryName: string | null },
  createdBy: string,
): Promise<string> {
  const searchKeywords = buildSearchKeywords(input.title, input.companyName, input.location);
  // Pre-generate the ref since transactions can't use addDoc's auto-ID path.
  const jobRef = doc(collection(db, "jobs"));
  await runTransaction(db, async (tx) => {
    tx.set(jobRef, {
      ...input,
      titleLower: input.title.toLowerCase(),
      searchKeywords,
      isDeleted: false,
      deletedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy,
    });
    tx.set(locationStatsRef(input.location), { location: input.location, count: increment(1) }, { merge: true });
  });
  return jobRef.id;
}

export async function updateJob(
  id: string,
  patch: Partial<JobInput> & { companyName?: string; companyLogoURL?: string | null; categoryName?: string; subcategoryName?: string | null },
): Promise<void> {
  const jobRef = doc(db, "jobs", id);
  await runTransaction(db, async (tx) => {
    const needsExisting = Boolean(patch.title || patch.companyName || patch.location !== undefined);
    // All reads must happen before any writes in a Firestore transaction.
    const existing = needsExisting
      ? (await tx.get(jobRef.withConverter(jobConverter))).data()
      : undefined;

    const updates: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
    if (patch.title) {
      updates.titleLower = patch.title.toLowerCase();
    }
    if (needsExisting) {
      updates.searchKeywords = buildSearchKeywords(
        patch.title ?? existing?.title,
        patch.companyName ?? existing?.companyName,
        patch.location ?? existing?.location,
      );
    }
    tx.update(jobRef, updates);

    if (
      patch.location !== undefined &&
      existing &&
      !existing.isDeleted &&
      patch.location !== existing.location
    ) {
      tx.set(locationStatsRef(existing.location), { location: existing.location, count: increment(-1) }, { merge: true });
      tx.set(locationStatsRef(patch.location), { location: patch.location, count: increment(1) }, { merge: true });
    }
  });
}

export async function setJobStatus(id: string, status: JobStatus): Promise<void> {
  await updateDoc(doc(db, "jobs", id), { status, updatedAt: serverTimestamp() });
}

export async function deleteJob(id: string): Promise<void> {
  const jobRef = doc(db, "jobs", id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(jobRef.withConverter(jobConverter));
    const existing = snap.data();
    if (!existing || existing.isDeleted) return; // already trashed or missing — no-op
    tx.update(jobRef, { isDeleted: true, deletedAt: serverTimestamp() });
    tx.set(locationStatsRef(existing.location), { location: existing.location, count: increment(-1) }, { merge: true });
  });
}

export async function restoreJob(id: string): Promise<void> {
  const jobRef = doc(db, "jobs", id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(jobRef.withConverter(jobConverter));
    const existing = snap.data();
    if (!existing || !existing.isDeleted) return; // already active or missing — no-op
    tx.update(jobRef, { isDeleted: false, deletedAt: null });
    tx.set(locationStatsRef(existing.location), { location: existing.location, count: increment(1) }, { merge: true });
  });
}

export async function getTrashedJobs(maxDocs = 100): Promise<Job[]> {
  const snap = await getDocs(
    query(jobsCol(), where("isDeleted", "==", true), orderBy("deletedAt", "desc"), fbLimit(maxDocs)),
  );
  return snap.docs.map((d) => d.data());
}

// Note: these are getCountFromServer aggregations with no doc fetch to filter
// client-side, so they include soft-deleted jobs (e.g. a trashed job still
// counts toward `published` if its status is still "published"). Adding
// isDeleted here would need yet more composite indexes for a dashboard stat
// tile — accepted as a known, minor drift rather than fixed in this pass.
export async function getJobCounts(): Promise<{
  total: number;
  published: number;
  draft: number;
  expired: number;
  unpublished: number;
}> {
  const [total, published, draft, expired, unpublished] = await Promise.all([
    getCountFromServer(query(jobsCol())),
    getCountFromServer(query(jobsCol(), where("status", "==", "published"))),
    getCountFromServer(query(jobsCol(), where("status", "==", "draft"))),
    getCountFromServer(query(jobsCol(), where("status", "==", "expired"))),
    getCountFromServer(query(jobsCol(), where("status", "==", "unpublished"))),
  ]);
  return {
    total: total.data().count,
    published: published.data().count,
    draft: draft.data().count,
    expired: expired.data().count,
    unpublished: unpublished.data().count,
  };
}

export async function getRecentJobs(
  orderByField: "createdAt" | "updatedAt",
  count: number,
): Promise<Job[]> {
  const snap = await getDocs(
    query(jobsCol(), orderBy(orderByField, "desc"), fbLimit(count)),
  );
  return snap.docs.map((d) => d.data()).filter((j) => !j.isDeleted);
}

// Note: a getCountFromServer aggregation with no doc fetch to filter
// client-side, so it includes soft-deleted jobs — same accepted trade-off as
// getJobCounts above.
export async function getCategoryJobCount(categorySlug: string): Promise<number> {
  const snap = await getCountFromServer(query(jobsCol(), where("category", "==", categorySlug)));
  return snap.data().count;
}

/**
 * Reads the maintained per-location job counters (kept in sync transactionally
 * by createJob/updateJob/deleteJob/restoreJob above) — bounded by the number
 * of distinct locations, not total jobs, so this scales independently of how
 * many jobs exist.
 */
export async function getJobLocationCounts(): Promise<{ location: string; count: number }[]> {
  const snap = await getDocs(collection(db, "jobLocationStats"));
  return snap.docs
    .map((d) => d.data() as { location: string; count: number })
    .filter((e) => e.count > 0);
}

// Note: same accepted "includes soft-deleted jobs" drift as getJobCounts above
// — 4 cheap getCountFromServer aggregations (one per fixed enum value), exact
// regardless of total job count.
export async function getEmploymentTypeJobCounts(): Promise<Record<EmploymentType, number>> {
  const entries = await Promise.all(
    EMPLOYMENT_TYPE_VALUES.map(async (type) => {
      const snap = await getCountFromServer(query(jobsCol(), where("employmentType", "==", type)));
      return [type, snap.data().count] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<EmploymentType, number>;
}
