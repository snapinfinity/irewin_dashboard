import type { Timestamp } from "firebase/firestore";

export interface Company {
  id: string;
  name: string;
  logoURL: string | null;
  website: string | null;
  createdAt: Timestamp;
}

export type CompanyInput = Omit<Company, "id" | "createdAt">;
