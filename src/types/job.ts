import type { Timestamp } from "firebase/firestore";

export type JobStatus = "draft" | "published" | "unpublished" | "expired";

export type WorkMode = "remote" | "hybrid" | "onsite";

export type EmploymentType =
  | "full-time"
  | "part-time"
  | "contract"
  | "internship";

export type ExperienceLevel =
  | "entry"
  | "mid"
  | "senior"
  | "lead"
  | "executive";

export interface Job {
  id: string;
  title: string;
  titleLower: string;
  companyId: string;
  companyName: string;
  companyLogoURL: string | null;
  category: string;
  categoryName: string;
  subcategory: string | null;
  subcategoryName: string | null;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  skills: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  applicationUrl: string;
  applicationDeadline: Timestamp | null;
  status: JobStatus;
  searchKeywords: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export type JobInput = Omit<
  Job,
  | "id"
  | "titleLower"
  | "searchKeywords"
  | "createdAt"
  | "updatedAt"
  | "createdBy"
  | "companyName"
  | "companyLogoURL"
  | "categoryName"
  | "subcategoryName"
>;
