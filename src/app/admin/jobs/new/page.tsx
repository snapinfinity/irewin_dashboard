import { JobForm } from "@/components/admin/jobs/JobForm";

export default function NewJobPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="sticky -top-4 -mx-4 z-20 border-b bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:-top-6 md:-mx-6 md:px-6">
        <h1 className="text-2xl font-semibold">Add Job</h1>
        <p className="text-sm text-muted-foreground">Create a new job listing.</p>
      </div>
      <JobForm job={null} />
    </div>
  );
}
