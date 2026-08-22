"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CursorPagination } from "@/components/shared/CursorPagination";
import { JobCard } from "@/components/public/JobCard";
import { JobFiltersSidebar } from "@/components/public/JobFiltersSidebar";
import { JobSearchBar } from "@/components/public/JobSearchBar";
import { useDebounce } from "@/hooks/use-debounce";
import { useJobsQuery } from "@/hooks/use-jobs-query";
import { PUBLIC_JOBS_PAGE_SIZE } from "@/lib/constants";
import { listCategories } from "@/lib/queries/categories";
import { getPublicLocations } from "@/lib/queries/publicJobs";
import type { JobFilters } from "@/lib/queries/jobs";
import type { Category } from "@/types/category";

export default function PublicJobsPage() {
  const [filters, setFilters] = useState<JobFilters>({ status: "published" });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    listCategories().then((cats) => setCategories(cats.filter((c) => c.enabled)));
    getPublicLocations().then(setLocations);
  }, []);

  const { jobs, loading, page, hasMore, hasPrevious, nextPage, previousPage } = useJobsQuery({
    filters: { ...filters, searchTerm: debouncedSearch || undefined },
    sortField: "createdAt",
    sortDirection: "desc",
    pageSize: PUBLIC_JOBS_PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Browse Jobs</h1>
        <JobSearchBar value={searchInput} onChange={setSearchInput} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <JobFiltersSidebar
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            locations={locations}
          />
        </aside>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-44" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description="Try adjusting your search or filters."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

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
      </div>
    </div>
  );
}
