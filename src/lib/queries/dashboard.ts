import { collection, getCountFromServer, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPE_VALUES } from "@/lib/constants";
import { listCategories } from "@/lib/queries/categories";
import {
  getCategoryJobCount,
  getEmploymentTypeJobCounts,
  getJobCounts,
  getJobLocationCounts,
} from "@/lib/queries/jobs";

export interface DashboardStats {
  totalJobs: number;
  publishedJobs: number;
  draftJobs: number;
  expiredJobs: number;
  unpublishedJobs: number;
  totalCategories: number;
  totalCompanies: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [jobCounts, categoryCount, companyCount] = await Promise.all([
    getJobCounts(),
    getCountFromServer(query(collection(db, "categories"))),
    getCountFromServer(query(collection(db, "companies"))),
  ]);

  return {
    totalJobs: jobCounts.total,
    publishedJobs: jobCounts.published,
    draftJobs: jobCounts.draft,
    expiredJobs: jobCounts.expired,
    unpublishedJobs: jobCounts.unpublished,
    totalCategories: categoryCount.data().count,
    totalCompanies: companyCount.data().count,
  };
}

export interface AggregationEntry {
  key: string;
  label: string;
  count: number;
}

export interface JobsAggregations {
  byCategory: AggregationEntry[];
  byLocation: AggregationEntry[];
  byEmploymentType: AggregationEntry[];
}

/**
 * Category and Employment Type are bounded, enumerable sets, so each is one
 * cheap getCountFromServer() per possible value — exact at any job-count
 * scale, no full-collection reads. Location is unbounded free text with no
 * fixed list to loop over, so it reads the maintained jobLocationStats
 * counters instead (see src/lib/queries/jobs.ts) — bounded by distinct
 * locations, not total jobs. Top-8 locations shown, rest folded into "Other"
 * to keep the chart legible.
 */
export async function getJobsAggregations(): Promise<JobsAggregations> {
  const categories = await listCategories();
  const [categoryCounts, locationCounts, employmentCounts] = await Promise.all([
    Promise.all(categories.map((c) => getCategoryJobCount(c.slug))),
    getJobLocationCounts(),
    getEmploymentTypeJobCounts(),
  ]);

  const byCategory = categories
    .map((c, i) => ({ key: c.slug, label: c.name, count: categoryCounts[i] }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  const byLocationSorted = locationCounts
    .map((e) => ({ key: e.location, label: e.location, count: e.count }))
    .sort((a, b) => b.count - a.count);
  const topLocations = byLocationSorted.slice(0, 8);
  const otherCount = byLocationSorted.slice(8).reduce((sum, e) => sum + e.count, 0);
  const byLocation = otherCount > 0 ? [...topLocations, { key: "other", label: "Other", count: otherCount }] : topLocations;

  const byEmploymentType = EMPLOYMENT_TYPE_VALUES.map((type) => ({
    key: type,
    label: EMPLOYMENT_TYPE_LABELS[type],
    count: employmentCounts[type],
  }));

  return { byCategory, byLocation, byEmploymentType };
}
