"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  createCompany,
  deleteCompanyLogo,
  updateCompany,
  uploadCompanyLogo,
} from "@/lib/queries/companies";
import type { Company } from "@/types/company";

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.union([z.literal(""), z.string().url("Enter a valid URL")]),
});

type FormValues = z.infer<typeof schema>;

export function CompanyForm({
  open,
  onOpenChange,
  company,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
  onSaved: () => void;
}) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logoURL ?? null);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company?.name ?? "",
      website: company?.website ?? "",
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (company) {
        let logoURL = company.logoURL;
        if (logoFile) {
          logoURL = await uploadCompanyLogo(company.id, logoFile);
          if (company.logoURL) await deleteCompanyLogo(company.logoURL);
        }
        await updateCompany(company.id, {
          name: values.name,
          website: values.website || null,
          logoURL,
        });
        toast.success("Company updated");
      } else {
        const id = await createCompany({ name: values.name, website: values.website || null, logoURL: null });
        if (logoFile) {
          const logoURL = await uploadCompanyLogo(id, logoFile);
          await updateCompany(id, { logoURL });
        }
        toast.success("Company created");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{company ? "Edit Company" : "Add Company"}</DialogTitle>
          <DialogDescription>
            Companies appear on job listings with their name and logo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 rounded-lg">
                <AvatarImage src={logoPreview ?? undefined} alt="Logo" />
                <AvatarFallback className="rounded-lg">
                  {form.watch("name")?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <Upload className="size-4" />
                Upload logo
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://acme.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
