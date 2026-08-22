"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { JobCard } from "@/components/public/JobCard";
import { CategoryChipList } from "@/components/public/CategoryChipList";
import { listCategories } from "@/lib/queries/categories";
import { getJobsPage } from "@/lib/queries/jobs";
import type { Category } from "@/types/category";
import type { Job } from "@/types/job";

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getJobsPage({ filters: { status: "published" }, sortField: "createdAt", sortDirection: "desc", pageSize: 6 }),
      listCategories(),
    ]).then(([jobsResult, cats]) => {
      setJobs(jobsResult.jobs);
      setCategories(cats.filter((c) => c.enabled));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col">
      <section className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Find your next role
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Browse open positions across every category, from remote-first startups to established companies.
          </p>
          <Button size="lg" asChild>
            <Link href="/jobs">
              <Briefcase className="size-4" />
              Browse all jobs
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="mb-4 text-lg font-semibold">Browse by category</h2>
        {loading ? (
          <div className="flex gap-2">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        ) : (
          <CategoryChipList categories={categories} />
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent jobs</h2>
          <Link href="/jobs" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState icon={Briefcase} title="No jobs yet" description="Check back soon for new openings." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}
      </section>
    </div>
  );
}
