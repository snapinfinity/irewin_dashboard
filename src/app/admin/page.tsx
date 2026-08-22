"use client";

import { useEffect, useState } from "react";
import { Briefcase, Building2, CheckCircle2, Clock, FileText, Tag } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { JobsByCategoryChart } from "@/components/admin/charts/JobsByCategoryChart";
import { JobsByLocationChart } from "@/components/admin/charts/JobsByLocationChart";
import { JobsByEmploymentTypeChart } from "@/components/admin/charts/JobsByEmploymentTypeChart";
import { RecentJobsTable } from "@/components/admin/RecentJobsTable";
import { Skeleton } from "@/components/ui/skeleton";
import { RECENT_JOBS_LIMIT } from "@/lib/constants";
import { getDashboardStats, getJobsAggregations, type DashboardStats, type JobsAggregations } from "@/lib/queries/dashboard";
import { getRecentJobs } from "@/lib/queries/jobs";
import type { Job } from "@/types/job";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [aggregations, setAggregations] = useState<JobsAggregations | null>(null);
  const [recentAdded, setRecentAdded] = useState<Job[]>([]);
  const [recentUpdated, setRecentUpdated] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [statsResult, aggregationsResult, addedResult, updatedResult] = await Promise.all([
        getDashboardStats(),
        getJobsAggregations(),
        getRecentJobs("createdAt", RECENT_JOBS_LIMIT),
        getRecentJobs("updatedAt", RECENT_JOBS_LIMIT),
      ]);
      if (cancelled) return;
      setStats(statsResult);
      setAggregations(aggregationsResult);
      setRecentAdded(addedResult);
      setRecentUpdated(updatedResult);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your job listings.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {loading || !stats ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-17" />)
        ) : (
          <>
            <StatCard label="Total Jobs" value={stats.totalJobs} icon={Briefcase} tone="violet" />
            <StatCard label="Active Jobs" value={stats.publishedJobs} icon={CheckCircle2} tone="emerald" />
            <StatCard label="Draft Jobs" value={stats.draftJobs} icon={FileText} tone="amber" />
            <StatCard label="Expired Jobs" value={stats.expiredJobs} icon={Clock} tone="rose" />
            <StatCard label="Categories" value={stats.totalCategories} icon={Tag} tone="violet" />
            <StatCard label="Companies" value={stats.totalCompanies} icon={Building2} tone="emerald" />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {loading || !aggregations ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72" />)
        ) : (
          <>
            <JobsByCategoryChart data={aggregations.byCategory} />
            <JobsByLocationChart data={aggregations.byLocation} />
            <JobsByEmploymentTypeChart data={aggregations.byEmploymentType} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </>
        ) : (
          <>
            <RecentJobsTable title="Recently Added Jobs" jobs={recentAdded} dateField="createdAt" />
            <RecentJobsTable title="Recently Updated Jobs" jobs={recentUpdated} dateField="updatedAt" />
          </>
        )}
      </div>
    </div>
  );
}
