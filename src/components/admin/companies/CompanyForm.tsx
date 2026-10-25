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
import { createCompany, encodeCompanyLogo, updateCompany } from "@/lib/queries/companies";
import { useAuth } from "@/lib/auth/useAuth";
import type { Company } from "@/types/company";

const schema = z.object({
  name: z.string().min(1, "Company name is required"),
  website: z.union([z.literal(""), z.string().url("Enter a valid URL")]),
});

type FormValues = z.infer<typeof schema>;

function errorMessage(err: unknown): string | undefined {
  return err instanceof Error ? err.message : undefined;
}

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
  const { user } = useAuth();
  const [logoURL, setLogoURL] = useState<string | null>(company?.logoURL ?? null);
  const [encodingLogo, setEncodingLogo] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: company?.name ?? "",
      website: company?.website ?? "",
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    // Reset so picking the same file again still fires onChange.
    input.value = "";
    if (!file) return;
    setEncodingLogo(true);
    try {
      setLogoURL(await encodeCompanyLogo(file));
    } catch (err) {
      toast.error("Couldn't use that logo", { description: errorMessage(err) });
    } finally {
      setEncodingLogo(false);
    }
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (company) {
        await updateCompany(company.id, {
          name: values.name,
          website: values.website || null,
          logoURL,
        });
        toast.success("Company updated");
      } else {
        if (!user) return;
        await createCompany({
          name: values.name,
          website: values.website || null,
          logoURL,
          createdBy: user.uid,
        });
        toast.success("Company created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to save company", { description: errorMessage(err) });
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
                <AvatarImage src={logoURL ?? undefined} alt="Logo" />
                <AvatarFallback className="rounded-lg">
                  {form.watch("name")?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                {encodingLogo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
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
              <Button type="submit" disabled={saving || encodingLogo}>
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
