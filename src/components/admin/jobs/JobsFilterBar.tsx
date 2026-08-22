"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_VALUES,
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVEL_VALUES,
  JOB_STATUS_LABELS,
  JOB_STATUS_VALUES,
  WORK_MODE_LABELS,
  WORK_MODE_VALUES,
} from "@/lib/constants";
import type { Category } from "@/types/category";
import type { JobFilters, JobSortField } from "@/lib/queries/jobs";

const ALL = "__all__";

export interface JobsSortState {
  field: JobSortField;
  direction: "asc" | "desc";
}

const SORT_OPTIONS: { value: string; label: string; field: JobSortField; direction: "asc" | "desc" }[] = [
  { value: "newest", label: "Newest", field: "createdAt", direction: "desc" },
  { value: "oldest", label: "Oldest", field: "createdAt", direction: "asc" },
  { value: "updated", label: "Recently updated", field: "updatedAt", direction: "desc" },
  { value: "title", label: "Title A-Z", field: "titleLower", direction: "asc" },
  { value: "salary-desc", label: "Salary: High to Low", field: "salaryMin", direction: "desc" },
  { value: "salary-asc", label: "Salary: Low to High", field: "salaryMin", direction: "asc" },
];

export function JobsFilterBar({
  filters,
  onFiltersChange,
  categories,
  sort,
  onSortChange,
}: {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  categories: Category[];
  sort: JobsSortState;
  onSortChange: (sort: JobsSortState) => void;
}) {
  const sortValue = SORT_OPTIONS.find((o) => o.field === sort.field && o.direction === sort.direction)?.value ?? "newest";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search title or company..."
          className="pl-8"
          value={filters.searchTerm ?? ""}
          onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value || undefined })}
        />
      </div>

      <Select
        value={filters.status ?? ALL}
        onValueChange={(v) => onFiltersChange({ ...filters, status: v === ALL ? undefined : (v as JobFilters["status"]) })}
      >
        <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {JOB_STATUS_VALUES.map((s) => (
            <SelectItem key={s} value={s}>{JOB_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.category ?? ALL}
        onValueChange={(v) => onFiltersChange({ ...filters, category: v === ALL ? undefined : v })}
      >
        <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.workMode ?? ALL}
        onValueChange={(v) => onFiltersChange({ ...filters, workMode: v === ALL ? undefined : (v as JobFilters["workMode"]) })}
      >
        <SelectTrigger className="w-36"><SelectValue placeholder="Work mode" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All work modes</SelectItem>
          {WORK_MODE_VALUES.map((v) => (
            <SelectItem key={v} value={v}>{WORK_MODE_LABELS[v]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.employmentType ?? ALL}
        onValueChange={(v) => onFiltersChange({ ...filters, employmentType: v === ALL ? undefined : (v as JobFilters["employmentType"]) })}
      >
        <SelectTrigger className="w-40"><SelectValue placeholder="Employment type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All employment types</SelectItem>
          {EMPLOYMENT_TYPE_VALUES.map((v) => (
            <SelectItem key={v} value={v}>{EMPLOYMENT_TYPE_LABELS[v]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.experienceLevel ?? ALL}
        onValueChange={(v) => onFiltersChange({ ...filters, experienceLevel: v === ALL ? undefined : (v as JobFilters["experienceLevel"]) })}
      >
        <SelectTrigger className="w-40"><SelectValue placeholder="Experience" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All experience levels</SelectItem>
          {EXPERIENCE_LEVEL_VALUES.map((v) => (
            <SelectItem key={v} value={v}>{EXPERIENCE_LEVEL_LABELS[v]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sortValue}
        onValueChange={(v) => {
          const option = SORT_OPTIONS.find((o) => o.value === v);
          if (option) onSortChange({ field: option.field, direction: option.direction });
        }}
      >
        <SelectTrigger className="ml-auto w-44"><SelectValue placeholder="Sort by" /></SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
