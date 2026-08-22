import type {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from "firebase/firestore";
import type { AdminUser } from "@/types/admin";
import type { Category } from "@/types/category";
import type { Company } from "@/types/company";
import type { Job } from "@/types/job";

function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(value: T) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- destructure id off to build the write payload
      const { id: _id, ...rest } = value;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return { id: snapshot.id, ...snapshot.data(options) } as T;
    },
  };
}

export const jobConverter = makeConverter<Job>();
export const categoryConverter = makeConverter<Category>();
export const companyConverter = makeConverter<Company>();

export const adminConverter: FirestoreDataConverter<AdminUser> = {
  toFirestore(value: AdminUser) {
    return { ...value };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): AdminUser {
    return { uid: snapshot.id, ...snapshot.data(options) } as AdminUser;
  },
};
