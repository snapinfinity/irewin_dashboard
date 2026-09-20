"use client";

import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  History,
  Link2,
  Loader2,
  MapPin,
  Pencil,
  Tag,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobStatusBadge } from "@/components/admin/jobs/JobStatusBadge";
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import { getJobById } from "@/lib/queries/jobs";
import { formatDate, formatRelativeDate, formatSalaryRange } from "@/lib/utils/format";
import { useAuth } from "@/lib/auth/useAuth";
import { cn } from "@/lib/utils";
import type { Job } from "@/types/job";

function Row({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <span className="flex-1 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Not specified.</p>
        ) : (
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function ViewJobPage() {
  const params = useParams<{ jobId: string }>();
  const { user, isAdminOrAbove } = useAuth();
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

  const canEdit = isAdminOrAbove || job.createdBy === user?.uid;
  const category = job.subcategoryName ? `${job.categoryName} / ${job.subcategoryName}` : job.categoryName;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/jobs"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Jobs
      </Link>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-xl">
              <AvatarImage src={job.companyLogoURL ?? undefined} alt={job.companyName} />
              <AvatarFallback className="rounded-xl text-lg">{job.companyName[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">{job.title}</h1>
              <p className="text-sm text-muted-foreground">{job.companyName}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {job.location}
                </span>
                <span className="text-border">&middot;</span>
                <span>{WORK_MODE_LABELS[job.workMode]}</span>
                <span className="text-border">&middot;</span>
                <span>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <JobStatusBadge status={job.status} />
            {canEdit && (
              <Button asChild size="sm">
                <Link href={`/admin/jobs/${job.id}/edit`}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent
              className={cn(
                "whitespace-pre-wrap text-sm text-muted-foreground",
                !job.description && "italic",
              )}
            >
              {job.description || "Not specified."}
            </CardContent>
          </Card>

          <ListSection title="Responsibilities" items={job.responsibilities} />
          <ListSection title="Requirements" items={job.requirements} />
          <ListSection title="Benefits" items={job.benefits} />
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5 text-sm">
              <Row icon={Tag} label="Category" value={category} />
              <Row icon={GraduationCap} label="Experience" value={EXPERIENCE_LEVEL_LABELS[job.experienceLevel]} />
              <Row icon={Wallet} label="Salary" value={formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)} />
              <Row
                icon={Calendar}
                label="Deadline"
                value={job.applicationDeadline ? formatDate(job.applicationDeadline) : "No deadline"}
              />
              <Row
                icon={Link2}
                label="Application"
                value={
                  <a
                    href={job.applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Visit <ExternalLink className="size-3.5" />
                  </a>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {job.skills.length === 0 ? (
                <p className="text-sm text-muted-foreground">No skills listed.</p>
              ) : (
                job.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3.5 text-sm">
              <Row icon={Clock} label="Created" value={formatRelativeDate(job.createdAt)} />
              <Row icon={History} label="Last updated" value={formatRelativeDate(job.updatedAt)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
