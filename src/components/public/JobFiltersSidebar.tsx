"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_VALUES,
  WORK_MODE_LABELS,
  WORK_MODE_VALUES,
} from "@/lib/constants";
import type { JobFilters } from "@/lib/queries/jobs";
import type { Category } from "@/types/category";

const ALL = "__all__";

export function JobFiltersSidebar({
  filters,
  onFiltersChange,
  categories,
  locations,
}: {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  categories: Category[];
  locations: string[];
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label>Category</Label>
        <Select
          value={filters.category ?? ALL}
          onValueChange={(v) => onFiltersChange({ ...filters, category: v === ALL ? undefined : v })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Location</Label>
        <Select
          value={filters.location ?? ALL}
          onValueChange={(v) => onFiltersChange({ ...filters, location: v === ALL ? undefined : v })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="All locations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Work Mode</Label>
        <Select
          value={filters.workMode ?? ALL}
          onValueChange={(v) => onFiltersChange({ ...filters, workMode: v === ALL ? undefined : (v as JobFilters["workMode"]) })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="All work modes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All work modes</SelectItem>
            {WORK_MODE_VALUES.map((v) => (
              <SelectItem key={v} value={v}>{WORK_MODE_LABELS[v]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Employment Type</Label>
        <Select
          value={filters.employmentType ?? ALL}
          onValueChange={(v) => onFiltersChange({ ...filters, employmentType: v === ALL ? undefined : (v as JobFilters["employmentType"]) })}
        >
          <SelectTrigger className="w-full"><SelectValue placeholder="All employment types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All employment types</SelectItem>
            {EMPLOYMENT_TYPE_VALUES.map((v) => (
              <SelectItem key={v} value={v}>{EMPLOYMENT_TYPE_LABELS[v]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
