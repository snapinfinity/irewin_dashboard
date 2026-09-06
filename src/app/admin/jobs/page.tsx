"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CursorPagination } from "@/components/shared/CursorPagination";
import { JobsFilterBar, type JobsSortState } from "@/components/admin/jobs/JobsFilterBar";
import { JobsTable } from "@/components/admin/jobs/JobsTable";
import { useJobsQuery } from "@/hooks/use-jobs-query";
import { JOBS_PAGE_SIZE } from "@/lib/constants";
import { listCategories } from "@/lib/queries/categories";
import type { JobFilters } from "@/lib/queries/jobs";
import type { Category } from "@/types/category";

export default function JobsPage() {
  const [filters, setFilters] = useState<JobFilters>({});
  const [sort, setSort] = useState<JobsSortState>({ field: "createdAt", direction: "desc" });
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    listCategories().then(setCategories);
  }, []);

  const { jobs, loading, error, page, hasMore, hasPrevious, refresh, nextPage, previousPage } = useJobsQuery({
    filters,
    sortField: sort.field,
    sortDirection: sort.direction,
    pageSize: JOBS_PAGE_SIZE,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-muted-foreground">Create, publish, and manage job listings.</p>
        </div>
        <Button asChild>
          <Link href="/admin/jobs/new">
            <Plus className="size-4" />
            Add Job
          </Link>
        </Button>
      </div>

      <JobsFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        sort={sort}
        onSortChange={setSort}
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">{error}</div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try adjusting your filters, or add a new job listing."
            />
          ) : (
            <JobsTable jobs={jobs} onChanged={refresh} />
          )}
        </CardContent>
      </Card>

      {!loading && jobs.length > 0 && (
        <CursorPagination
          page={page}
          hasMore={hasMore}
          hasPrevious={hasPrevious}
          onNext={nextPage}
          onPrevious={previousPage}
        />
      )}
    </div>
  );
}
