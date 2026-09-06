"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { JobForm } from "@/components/admin/jobs/JobForm";
import { getJobById } from "@/lib/queries/jobs";
import type { Job } from "@/types/job";

export default function EditJobPage() {
  const params = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    getJobById(params.jobId).then(setJob);
  }, [params.jobId]);

  if (job === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (job === null) {
    return <p className="text-sm text-muted-foreground">Job not found.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky -top-4 -mx-4 z-20 border-b bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:-top-6 md:-mx-6 md:px-6">
        <h1 className="text-2xl font-semibold">Edit Job</h1>
        <p className="text-sm text-muted-foreground">{job.title}</p>
      </div>
      <JobForm job={job} />
    </div>
  );
}
