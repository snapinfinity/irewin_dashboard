"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocumentSnapshot } from "firebase/firestore";
import { getJobsPage, type JobFilters, type JobSortField } from "@/lib/queries/jobs";
import type { Job } from "@/types/job";

export function useJobsQuery(options: {
  filters: JobFilters;
  sortField: JobSortField;
  sortDirection: "asc" | "desc";
  pageSize: number;
}) {
  const { filters, sortField, sortDirection, pageSize } = options;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const cursorStack = useRef<(DocumentSnapshot | null)[]>([null]);

  const filtersKey = JSON.stringify(filters);

  const loadPage = useCallback(
    async (pageIndex: number) => {
      setLoading(true);
      setError(null);
      const cursor = cursorStack.current[pageIndex - 1] ?? null;
      try {
        const result = await getJobsPage({
          filters,
          sortField,
          sortDirection,
          pageSize,
          cursor,
        });
        cursorStack.current[pageIndex] = result.lastDoc;
        setJobs(result.jobs);
        setHasMore(result.hasMore);
        setPage(pageIndex);
      } catch (err) {
        console.error("[jobs] Failed to load jobs page:", err);
        setError(err instanceof Error ? err.message : "Failed to load jobs");
        setJobs([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtersKey, sortField, sortDirection, pageSize],
  );

  useEffect(() => {
    cursorStack.current = [null];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-filter-change
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey, sortField, sortDirection, pageSize]);

  const refresh = useCallback(() => loadPage(page), [loadPage, page]);
  const nextPage = useCallback(() => loadPage(page + 1), [loadPage, page]);
  const previousPage = useCallback(() => loadPage(Math.max(1, page - 1)), [loadPage, page]);

  return {
    jobs,
    loading,
    error,
    page,
    hasMore,
    hasPrevious: page > 1,
    refresh,
    nextPage,
    previousPage,
  };
}
