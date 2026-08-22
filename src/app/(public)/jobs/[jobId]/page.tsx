"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Briefcase, Calendar, Loader2, MapPin, Wallet } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  WORK_MODE_LABELS,
} from "@/lib/constants";
import { getJobById } from "@/lib/queries/jobs";
import { formatDate, formatRelativeDate, formatSalaryRange, isPastDeadline } from "@/lib/utils/format";
import type { Job } from "@/types/job";

export default function JobDetailsPage() {
  const params = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null | undefined>(undefined);

  useEffect(() => {
    getJobById(params.jobId).then((result) =>
      setJob(result && result.status === "published" ? result : null),
    );
  }, [params.jobId]);

  if (job === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={Briefcase}
          title="Job not found"
          description="This job may have been removed or is no longer available."
          action={
            <Button asChild variant="outline">
              <Link href="/jobs">Browse other jobs</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const expired = isPastDeadline(job.applicationDeadline);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 rounded-lg">
              <AvatarImage src={job.companyLogoURL ?? undefined} alt={job.companyName} />
              <AvatarFallback className="rounded-lg text-lg">
                {job.companyName[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">{job.title}</h1>
              <p className="text-muted-foreground">{job.companyName}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary"><MapPin className="size-3" />{job.location}</Badge>
            <Badge variant="secondary">{WORK_MODE_LABELS[job.workMode]}</Badge>
            <Badge variant="secondary">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</Badge>
            <Badge variant="secondary">{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
            <Badge variant="secondary"><Wallet className="size-3" />{formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}</Badge>
          </div>

          {job.applicationDeadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="size-4" />
              {expired ? (
                <span className="text-destructive">Application deadline passed ({formatDate(job.applicationDeadline)})</span>
              ) : (
                <span>Apply by {formatDate(job.applicationDeadline)} ({formatRelativeDate(job.applicationDeadline)})</span>
              )}
            </div>
          )}

          {expired ? (
            <Button size="lg" className="w-full sm:w-fit" disabled>
              Applications Closed
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-fit" asChild>
              <a href={job.applicationUrl} target="_blank" rel="noreferrer">
                Apply Now
              </a>
            </Button>
          )}

          {job.skills.length > 0 && (
            <section>
              <h2 className="mb-2 font-medium">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-2 font-medium">Description</h2>
            <p className="whitespace-pre-line text-sm text-muted-foreground">{job.description}</p>
          </section>

          {job.responsibilities.length > 0 && (
            <section>
              <h2 className="mb-2 font-medium">Responsibilities</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {job.responsibilities.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
          )}

          {job.requirements.length > 0 && (
            <section>
              <h2 className="mb-2 font-medium">Requirements</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {job.requirements.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
          )}

          {job.benefits.length > 0 && (
            <section>
              <h2 className="mb-2 font-medium">Benefits</h2>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {job.benefits.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </section>
          )}

          {expired ? (
            <Button size="lg" className="w-full sm:w-fit" disabled>
              Applications Closed
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-fit" asChild>
              <a href={job.applicationUrl} target="_blank" rel="noreferrer">
                Apply Now
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
