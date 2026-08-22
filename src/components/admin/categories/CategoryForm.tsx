"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { SubcategoryEditor } from "@/components/admin/categories/SubcategoryEditor";
import { createCategory, updateCategory } from "@/lib/queries/categories";
import { slugify } from "@/lib/utils/slugify";
import { useAuth } from "@/lib/auth/useAuth";
import type { Category, Subcategory } from "@/types/category";

const schema = z.object({
  name: z.string().min(1, "Category name is required"),
  enabled: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function CategoryForm({
  open,
  onOpenChange,
  category,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [subcategories, setSubcategories] = useState<Subcategory[]>(category?.subcategories ?? []);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      enabled: category?.enabled ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    const cleanSubcategories = subcategories.filter((s) => s.name.trim().length > 0);
    setSaving(true);
    try {
      if (category) {
        await updateCategory(category.slug, {
          name: values.name,
          enabled: values.enabled,
          subcategories: cleanSubcategories,
        });
        toast.success("Category updated");
      } else {
        if (!user) return;
        await createCategory({
          name: values.name,
          slug: slugify(values.name),
          enabled: values.enabled,
          subcategories: cleanSubcategories,
          createdBy: user.uid,
        });
        toast.success("Category created");
      }
      onSaved();
      onOpenChange(false);
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ece9fc] text-primary">
              <Tag className="size-5" />
            </div>
            <div>
              <DialogTitle>{category ? "Edit Category" : "Add Category"}</DialogTitle>
              <DialogDescription>
                Categories group jobs so applicants can filter by field.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category name</FormLabel>
                  <FormControl>
                    <Input placeholder="Software Development" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg bg-muted p-3">
                  <div>
                    <FormLabel>Enabled</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Disabled categories are hidden on the public job site.
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <SubcategoryEditor value={subcategories} onChange={setSubcategories} />
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
