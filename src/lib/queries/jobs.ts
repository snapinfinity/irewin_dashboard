import {
  collection,
  deleteDoc,
  doc,
  type DocumentSnapshot,
  getCountFromServer,
  getDoc,
  getDocs,
  limit as fbLimit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  type QueryConstraint,
  updateDoc,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { jobConverter } from "@/lib/firebase/converters";
import { buildSearchKeywords, normalizeSearchTerm } from "@/lib/utils/searchKeywords";
import { JOBS_PAGE_SIZE } from "@/lib/constants";
import type {
  EmploymentType,
  ExperienceLevel,
  Job,
  JobInput,
  JobStatus,
  WorkMode,
} from "@/types/job";

const jobsCol = () => collection(db, "jobs").withConverter(jobConverter);

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

  return {
    jobs: pageDocs.map((d) => d.data()),
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
  const ref = await addDoc(collection(db, "jobs"), {
    ...input,
    titleLower: input.title.toLowerCase(),
    searchKeywords,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy,
  });
  return ref.id;
}

export async function updateJob(
  id: string,
  patch: Partial<JobInput> & { companyName?: string; companyLogoURL?: string | null; categoryName?: string; subcategoryName?: string | null },
): Promise<void> {
  const updates: Record<string, unknown> = { ...patch, updatedAt: serverTimestamp() };
  if (patch.title) {
    updates.titleLower = patch.title.toLowerCase();
  }
  if (patch.title || patch.companyName || patch.location) {
    const existing = await getJobById(id);
    updates.searchKeywords = buildSearchKeywords(
      patch.title ?? existing?.title,
      patch.companyName ?? existing?.companyName,
      patch.location ?? existing?.location,
    );
  }
  await updateDoc(doc(db, "jobs", id), updates);
}

export async function setJobStatus(id: string, status: JobStatus): Promise<void> {
  await updateDoc(doc(db, "jobs", id), { status, updatedAt: serverTimestamp() });
}

export async function deleteJob(id: string): Promise<void> {
  await deleteDoc(doc(db, "jobs", id));
}

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
  return snap.docs.map((d) => d.data());
}

export async function getCategoryJobCount(categorySlug: string): Promise<number> {
  const snap = await getCountFromServer(query(jobsCol(), where("category", "==", categorySlug)));
  return snap.data().count;
}

/**
 * Fetches jobs for client-side dashboard aggregation (by category/location/
 * employment type). Bounded by DASHBOARD_AGGREGATION_LIMIT — acceptable at
 * admin scale; a larger dataset should migrate to stored counters or a
 * BigQuery export instead of this full-collection read.
 */
export async function getJobsForAggregation(maxDocs: number): Promise<Job[]> {
  const snap = await getDocs(query(jobsCol(), fbLimit(maxDocs)));
  return snap.docs.map((d) => d.data());
}
