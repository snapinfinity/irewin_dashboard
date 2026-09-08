"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Timestamp } from "firebase/firestore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StringListEditor } from "@/components/shared/StringListEditor";
import {
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_TYPE_VALUES,
  EXPERIENCE_LEVEL_LABELS,
  EXPERIENCE_LEVEL_VALUES,
  JOB_STATUS_LABELS,
  JOB_STATUS_VALUES,
  WORK_MODE_LABELS,
  WORK_MODE_VALUES,
} from "@/lib/constants";
import { listCategories } from "@/lib/queries/categories";
import { listCompanies } from "@/lib/queries/companies";
import { createJob, updateJob } from "@/lib/queries/jobs";
import { useAuth } from "@/lib/auth/useAuth";
import type { Category } from "@/types/category";
import type { Company } from "@/types/company";
import type { Job } from "@/types/job";

const schema = z.object({
  title: z.string().min(1, "Job title is required"),
  companyId: z.string().min(1, "Select a company"),
  category: z.string().min(1, "Select a category"),
  subcategory: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  workMode: z.enum(WORK_MODE_VALUES as [string, ...string[]]),
  employmentType: z.enum(EMPLOYMENT_TYPE_VALUES as [string, ...string[]]),
  experienceLevel: z.enum(EXPERIENCE_LEVEL_VALUES as [string, ...string[]]),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  currency: z.string().min(1),
  description: z.string().min(1, "Description is required"),
  applicationUrl: z.string().url("Enter a valid URL"),
  applicationDeadline: z.string().optional(),
  status: z.enum(JOB_STATUS_VALUES as [string, ...string[]]),
});

type FormValues = z.infer<typeof schema>;

export function JobForm({ job }: { job: Job | null }) {
  const router = useRouter();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<string[]>(job?.skills ?? []);
  const [responsibilities, setResponsibilities] = useState<string[]>(job?.responsibilities ?? []);
  const [requirements, setRequirements] = useState<string[]>(job?.requirements ?? []);
  const [benefits, setBenefits] = useState<string[]>(job?.benefits ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    listCompanies().then(setCompanies);
    listCategories().then(setCategories);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: job?.title ?? "",
      companyId: job?.companyId ?? "",
      category: job?.category ?? "",
      subcategory: job?.subcategory ?? "",
      location: job?.location ?? "",
      workMode: job?.workMode ?? "remote",
      employmentType: job?.employmentType ?? "full-time",
      experienceLevel: job?.experienceLevel ?? "mid",
      salaryMin: job?.salaryMin != null ? String(job.salaryMin) : "",
      salaryMax: job?.salaryMax != null ? String(job.salaryMax) : "",
      currency: job?.currency ?? "USD",
      description: job?.description ?? "",
      applicationUrl: job?.applicationUrl ?? "",
      applicationDeadline: job?.applicationDeadline
        ? job.applicationDeadline.toDate().toISOString().slice(0, 10)
        : "",
      status: job?.status ?? "draft",
    },
  });

  const selectedCategory = categories.find((c) => c.slug === form.watch("category"));
  const availableSubcategories = useMemo(
    () => selectedCategory?.subcategories.filter((s) => !s.isDeleted) ?? [],
    [selectedCategory],
  );

  async function onSubmit(values: FormValues) {
    const company = companies.find((c) => c.id === values.companyId);
    const category = categories.find((c) => c.slug === values.category);
    const subcategory = category?.subcategories.find((s) => s.slug === values.subcategory);

    if (!company || !category) {
      toast.error("Select a valid company and category");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: values.title,
        companyId: values.companyId,
        companyName: company.name,
        companyLogoURL: company.logoURL,
        category: values.category,
        categoryName: category.name,
        subcategory: subcategory?.slug ?? null,
        subcategoryName: subcategory?.name ?? null,
        location: values.location,
        workMode: values.workMode as Job["workMode"],
        employmentType: values.employmentType as Job["employmentType"],
        experienceLevel: values.experienceLevel as Job["experienceLevel"],
        salaryMin: values.salaryMin ? Number(values.salaryMin) : null,
        salaryMax: values.salaryMax ? Number(values.salaryMax) : null,
        currency: values.currency,
        skills: skills.filter(Boolean),
        description: values.description,
        responsibilities: responsibilities.filter(Boolean),
        requirements: requirements.filter(Boolean),
        benefits: benefits.filter(Boolean),
        applicationUrl: values.applicationUrl,
        applicationDeadline: values.applicationDeadline
          ? Timestamp.fromDate(new Date(values.applicationDeadline))
          : null,
        status: values.status as Job["status"],
      };

      if (job) {
        await updateJob(job.id, payload);
        toast.success("Job updated");
      } else if (user) {
        await createJob(payload, user.uid);
        toast.success("Job created");
      }
      router.push("/admin/jobs");
      router.refresh();
    } catch {
      toast.error("Failed to save job");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basics</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Job title</FormLabel>
                  <FormControl>
                    <Input placeholder="Senior Frontend Developer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a company" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Bengaluru, India" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-full bg-[#ece9fc] text-primary">
                <Tag className="size-4" />
              </div>
              <div>
                <CardTitle className="text-base">Category &amp; Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pick a category to reveal its subcategories, then set where this job stands.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 rounded-xl bg-[#ece9fc]/50 p-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("subcategory", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-card">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={availableSubcategories.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-card">
                          <SelectValue
                            placeholder={
                              availableSubcategories.length === 0
                                ? "No subcategories for this category"
                                : "Select a subcategory"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableSubcategories.map((s) => (
                          <SelectItem key={s.slug} value={s.slug}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="mt-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_STATUS_VALUES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {JOB_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="workMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work mode</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WORK_MODE_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {WORK_MODE_LABELS[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employment type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {EMPLOYMENT_TYPE_LABELS[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience level</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPERIENCE_LEVEL_VALUES.map((v) => (
                        <SelectItem key={v} value={v}>
                          {EXPERIENCE_LEVEL_LABELS[v]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salaryMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary min</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="60000" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="salaryMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salary max</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="90000" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input placeholder="USD" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applicationUrl"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Application URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://company.com/careers/apply" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="applicationDeadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application deadline</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="sm:col-span-3">
              <StringListEditor label="Skills" placeholder="React" value={skills} onChange={setSkills} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job description</FormLabel>
                  <FormControl>
                    <Textarea rows={6} placeholder="Describe the role..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <StringListEditor
              label="Responsibilities"
              placeholder="Ship features end-to-end"
              value={responsibilities}
              onChange={setResponsibilities}
            />
            <StringListEditor
              label="Requirements"
              placeholder="3+ years of React experience"
              value={requirements}
              onChange={setRequirements}
            />
            <StringListEditor
              label="Benefits"
              placeholder="Health insurance"
              value={benefits}
              onChange={setBenefits}
            />
          </CardContent>
        </Card>

        <div className="fixed inset-x-0 bottom-0 z-40 flex justify-end gap-3 border-t bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 md:left-60 md:px-6">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/jobs")}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : null}
            {job ? "Save changes" : "Create job"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
