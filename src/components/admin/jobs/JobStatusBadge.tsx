import { Badge } from "@/components/ui/badge";
import { JOB_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { JobStatus } from "@/types/job";

const STATUS_STYLES: Record<JobStatus, string> = {
  published: "bg-[#0ca30c]/10 text-[#0ca30c] dark:text-[#4ade80]",
  draft: "bg-muted text-muted-foreground",
  unpublished: "bg-[#fab219]/15 text-[#a06600] dark:text-[#fab219]",
  expired: "bg-[#d03b3b]/10 text-[#d03b3b]",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", STATUS_STYLES[status])}>
      {JOB_STATUS_LABELS[status]}
    </Badge>
  );
}
