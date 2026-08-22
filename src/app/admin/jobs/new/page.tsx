import { JobForm } from "@/components/admin/jobs/JobForm";

export default function NewJobPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Add Job</h1>
        <p className="text-sm text-muted-foreground">Create a new job listing.</p>
      </div>
      <JobForm job={null} />
    </div>
  );
}
