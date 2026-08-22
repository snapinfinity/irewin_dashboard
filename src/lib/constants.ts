import type { EmploymentType, ExperienceLevel, JobStatus, WorkMode } from "@/types/job";

export const JOB_STATUS_VALUES: JobStatus[] = [
  "draft",
  "published",
  "unpublished",
  "expired",
];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  draft: "Draft",
  published: "Published",
  unpublished: "Unpublished",
  expired: "Expired",
};

export const WORK_MODE_VALUES: WorkMode[] = ["remote", "hybrid", "onsite"];

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const EMPLOYMENT_TYPE_VALUES: EmploymentType[] = [
  "full-time",
  "part-time",
  "contract",
  "internship",
];

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
};

export const EXPERIENCE_LEVEL_VALUES: ExperienceLevel[] = [
  "entry",
  "mid",
  "senior",
  "lead",
  "executive",
];

export const EXPERIENCE_LEVEL_LABELS: Record<ExperienceLevel, string> = {
  entry: "Entry Level",
  mid: "Mid Level",
  senior: "Senior Level",
  lead: "Lead",
  executive: "Executive",
};

export const DEFAULT_CURRENCY = "USD";

export const JOBS_PAGE_SIZE = 20;
export const PUBLIC_JOBS_PAGE_SIZE = 12;
export const RECENT_JOBS_LIMIT = 5;
export const DASHBOARD_AGGREGATION_LIMIT = 3000;
