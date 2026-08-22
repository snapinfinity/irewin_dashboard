"use client";

import { useState } from "react";
import { CheckCircle2, EyeOff, FileText, MoreHorizontal, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setJobStatus } from "@/lib/queries/jobs";
import type { Job, JobStatus } from "@/types/job";

const ACTIONS: { status: JobStatus; label: string; icon: typeof CheckCircle2 }[] = [
  { status: "published", label: "Publish", icon: CheckCircle2 },
  { status: "unpublished", label: "Unpublish", icon: EyeOff },
  { status: "draft", label: "Save as Draft", icon: FileText },
  { status: "expired", label: "Mark as Expired", icon: XCircle },
];

export function JobStatusMenu({ job, onChanged }: { job: Job; onChanged: () => void }) {
  const [pending, setPending] = useState(false);

  async function handleChange(status: JobStatus) {
    setPending(true);
    try {
      await setJobStatus(job.id, status);
      toast.success(`Job marked as ${status}`);
      onChanged();
    } catch {
      toast.error("Failed to update job status");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={pending}>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ACTIONS.filter((a) => a.status !== job.status).map((action) => (
          <DropdownMenuItem key={action.status} onClick={() => handleChange(action.status)}>
            <action.icon className="size-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
