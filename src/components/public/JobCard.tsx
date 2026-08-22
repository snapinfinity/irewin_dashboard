import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import { formatRelativeDate, formatSalaryRange } from "@/lib/utils/format";
import type { Job } from "@/types/job";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="h-full transition-colors hover:border-primary/40">
        <CardContent className="flex h-full flex-col gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="size-11 rounded-lg">
              <AvatarImage src={job.companyLogoURL ?? undefined} alt={job.companyName} />
              <AvatarFallback className="rounded-lg">{job.companyName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="truncate font-semibold leading-tight">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" />
            {job.location}
          </div>

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">{WORK_MODE_LABELS[job.workMode]}</Badge>
            <Badge variant="secondary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2 text-sm">
            <span className="font-medium">{formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}</span>
            <span className="text-muted-foreground">{formatRelativeDate(job.createdAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
