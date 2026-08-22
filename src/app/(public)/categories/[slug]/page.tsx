"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Briefcase, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CursorPagination } from "@/components/shared/CursorPagination";
import { JobCard } from "@/components/public/JobCard";
import { useJobsQuery } from "@/hooks/use-jobs-query";
import { PUBLIC_JOBS_PAGE_SIZE } from "@/lib/constants";
import { getCategoryBySlug } from "@/lib/queries/categories";
import type { Category } from "@/types/category";

export default function CategoryJobsPage() {
  const params = useParams<{ slug: string }>();
  const [category, setCategory] = useState<Category | null | undefined>(undefined);

  useEffect(() => {
    getCategoryBySlug(params.slug).then(setCategory);
  }, [params.slug]);

  const { jobs, loading, page, hasMore, hasPrevious, nextPage, previousPage } = useJobsQuery({
    filters: { status: "published", category: params.slug },
    sortField: "createdAt",
    sortDirection: "desc",
    pageSize: PUBLIC_JOBS_PAGE_SIZE,
  });

  if (category === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">{category?.name ?? "Category"} Jobs</h1>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState icon={Briefcase} title="No jobs in this category yet" description="Check back soon for new openings." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="mt-6">
          <CursorPagination page={page} hasMore={hasMore} hasPrevious={hasPrevious} onNext={nextPage} onPrevious={previousPage} />
        </div>
      )}
    </div>
  );
}
