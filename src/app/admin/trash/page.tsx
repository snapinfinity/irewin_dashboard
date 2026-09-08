"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAuth } from "@/lib/auth/useAuth";
import { getTrashedJobs, restoreJob } from "@/lib/queries/jobs";
import { getDeletedCompanies, restoreCompany } from "@/lib/queries/companies";
import { getDeletedCategories, restoreCategory } from "@/lib/queries/categories";
import { formatRelativeDate } from "@/lib/utils/format";
import type { Job } from "@/types/job";
import type { Company } from "@/types/company";
import type { Category } from "@/types/category";

export default function TrashPage() {
  const { isAdminOrAbove } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [j, c, cat] = await Promise.all([
      getTrashedJobs(),
      getDeletedCompanies(),
      getDeletedCategories(),
    ]);
    setJobs(j);
    setCompanies(c);
    setCategories(cat);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAdminOrAbove) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    refresh();
  }, [isAdminOrAbove, refresh]);

  if (!isAdminOrAbove) {
    return <p className="text-sm text-muted-foreground">Only Admins can view Trash.</p>;
  }

  async function handleRestoreJob(job: Job) {
    await restoreJob(job.id);
    toast.success(`"${job.title}" restored`);
    refresh();
  }

  async function handleRestoreCompany(company: Company) {
    await restoreCompany(company.id);
    toast.success(`"${company.name}" restored`);
    refresh();
  }

  async function handleRestoreCategory(category: Category) {
    await restoreCategory(category.slug);
    toast.success(`"${category.name}" restored`);
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Trash</h1>
        <p className="text-sm text-muted-foreground">
          Deleted jobs, companies, and categories. Restore them here, or leave them — they
          stay out of every list until then.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jobs</CardTitle>
          <CardDescription>Deleted job listings.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState icon={Trash2} title="No deleted jobs" description="Jobs you move to trash appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeDate(job.deletedAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm" title="Restore" onClick={() => handleRestoreJob(job)}>
                        <RotateCcw className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Companies</CardTitle>
          <CardDescription>Deleted company profiles.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : companies.length === 0 ? (
            <EmptyState icon={Trash2} title="No deleted companies" description="Companies you move to trash appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeDate(company.deletedAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Restore"
                        onClick={() => handleRestoreCompany(company)}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
          <CardDescription>Deleted categories.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState icon={Trash2} title="No deleted categories" description="Categories you move to trash appear here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Deleted</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatRelativeDate(category.deletedAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Restore"
                        onClick={() => handleRestoreCategory(category)}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
