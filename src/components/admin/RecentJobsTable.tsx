import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/admin/jobs/JobStatusBadge";
import { formatRelativeDate } from "@/lib/utils/format";
import type { Job } from "@/types/job";

export function RecentJobsTable({
  title,
  jobs,
  dateField,
}: {
  title: string;
  jobs: Job[];
  dateField: "createdAt" | "updatedAt";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {jobs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No jobs yet.</p>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/admin/jobs/${job.id}`}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <Avatar className="size-9 shrink-0 rounded-md">
                <AvatarImage src={job.companyLogoURL ?? undefined} alt={job.companyName} />
                <AvatarFallback className="rounded-md">{job.companyName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{job.title}</p>
                <p className="truncate text-xs text-muted-foreground">{job.companyName}</p>
              </div>
              <JobStatusBadge status={job.status} />
              <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
                {formatRelativeDate(job[dateField])}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
