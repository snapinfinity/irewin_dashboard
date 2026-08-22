"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { JobStatusBadge } from "@/components/admin/jobs/JobStatusBadge";
import { JobStatusMenu } from "@/components/admin/jobs/JobStatusMenu";
import { EMPLOYMENT_TYPE_LABELS, WORK_MODE_LABELS } from "@/lib/constants";
import { deleteJob } from "@/lib/queries/jobs";
import { formatRelativeDate, formatSalaryRange } from "@/lib/utils/format";
import { useAuth } from "@/lib/auth/useAuth";
import type { Job } from "@/types/job";

export function JobsTable({ jobs, onChanged }: { jobs: Job[]; onChanged: () => void }) {
  const { user, isAdminOrAbove } = useAuth();
  const [deleting, setDeleting] = useState<Job | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            // Mirrors firestore.rules: Admin/above can edit anything, an
            // Employee only their own — matched here so the UI never offers
            // an action the rules would reject anyway.
            const canEdit = isAdminOrAbove || job.createdBy === user?.uid;
            return (
              <TableRow key={job.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8 rounded-md">
                      <AvatarImage src={job.companyLogoURL ?? undefined} alt={job.companyName} />
                      <AvatarFallback className="rounded-md">{job.companyName[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      {canEdit ? (
                        <Link href={`/admin/jobs/${job.id}/edit`} className="font-medium hover:underline">
                          {job.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{job.title}</span>
                      )}
                      <p className="text-xs text-muted-foreground">{job.companyName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {job.location} &middot; {WORK_MODE_LABELS[job.workMode]}
                </TableCell>
                <TableCell className="text-muted-foreground">{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</TableCell>
                <TableCell className="text-muted-foreground">
                  {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
                </TableCell>
                <TableCell>
                  <JobStatusBadge status={job.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatRelativeDate(job.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                      <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={`/admin/jobs/${job.id}/edit`} title="Edit">
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                    )}
                    {isAdminOrAbove && (
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(job)} title="Delete">
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                    {canEdit && <JobStatusMenu job={job} onChanged={onChanged} />}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {deleting && (
        <ConfirmDialog
          open={!!deleting}
          onOpenChange={(open) => !open && setDeleting(null)}
          title={`Delete "${deleting.title}"?`}
          description="This permanently removes the job listing. This cannot be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={async () => {
            await deleteJob(deleting.id);
            toast.success("Job deleted");
            onChanged();
          }}
        />
      )}
    </>
  );
}
