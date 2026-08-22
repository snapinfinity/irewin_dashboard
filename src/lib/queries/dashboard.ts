import { collection, getCountFromServer, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DASHBOARD_AGGREGATION_LIMIT } from "@/lib/constants";
import { getJobCounts, getJobsForAggregation } from "@/lib/queries/jobs";
import type { EmploymentType } from "@/types/job";

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
 * Client-side aggregation over a bounded fetch of jobs — see the tradeoff
 * documented on getJobsForAggregation(). Top-8 locations shown, rest folded
 * into "Other" to keep the chart legible.
 */
export async function getJobsAggregations(): Promise<JobsAggregations> {
  const jobs = await getJobsForAggregation(DASHBOARD_AGGREGATION_LIMIT);

  const byCategoryMap = new Map<string, AggregationEntry>();
  const byLocationMap = new Map<string, number>();
  const byEmploymentTypeMap = new Map<EmploymentType, number>();

  for (const job of jobs) {
    const existing = byCategoryMap.get(job.category);
    if (existing) {
      existing.count += 1;
    } else {
      byCategoryMap.set(job.category, { key: job.category, label: job.categoryName, count: 1 });
    }

    byLocationMap.set(job.location, (byLocationMap.get(job.location) ?? 0) + 1);
    byEmploymentTypeMap.set(job.employmentType, (byEmploymentTypeMap.get(job.employmentType) ?? 0) + 1);
  }

  const byLocationSorted = Array.from(byLocationMap.entries())
    .map(([key, count]) => ({ key, label: key, count }))
    .sort((a, b) => b.count - a.count);

  const topLocations = byLocationSorted.slice(0, 8);
  const otherCount = byLocationSorted.slice(8).reduce((sum, e) => sum + e.count, 0);
  const byLocation = otherCount > 0 ? [...topLocations, { key: "other", label: "Other", count: otherCount }] : topLocations;

  const byEmploymentType = Array.from(byEmploymentTypeMap.entries()).map(([key, count]) => ({
    key,
    label: key,
    count,
  }));

  return {
    byCategory: Array.from(byCategoryMap.values()).sort((a, b) => b.count - a.count),
    byLocation,
    byEmploymentType,
  };
}
