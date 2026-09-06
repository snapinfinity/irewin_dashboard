"use client";

import { useEffect, useState } from "react";
import { MoreHorizontal, Pencil, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SubcategoryBadgeList } from "@/components/admin/categories/SubcategoryBadgeList";
import { deleteCategory, setCategoryEnabled } from "@/lib/queries/categories";
import { getCategoryJobCount } from "@/lib/queries/jobs";
import { useAuth } from "@/lib/auth/useAuth";
import type { Category } from "@/types/category";

const AVATAR_TONES = [
  "bg-[#ece9fc] text-[#4f46e5]",
  "bg-[#fdedf0] text-[#f43f5e]",
  "bg-[#e6f9ec] text-[#22c55e]",
  "bg-[#fdf1e2] text-[#f97316]",
];

export function CategoriesTable({
  categories,
  onEdit,
  onChanged,
}: {
  categories: Category[];
  onEdit: (category: Category) => void;
  onChanged: () => void;
}) {
  const { user, isAdminOrAbove } = useAuth();
  const [jobCounts, setJobCounts] = useState<Record<string, number>>({});
  const [deleting, setDeleting] = useState<Category | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all(categories.map((c) => getCategoryJobCount(c.slug).then((count) => [c.slug, count] as const))).then(
      (entries) => {
        if (cancelled) return;
        setJobCounts(Object.fromEntries(entries));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [categories]);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Subcategories</TableHead>
            <TableHead>Jobs</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category, index) => {
            // Mirrors firestore.rules: Admin/above can edit anything, an
            // Employee only their own.
            const canEdit = isAdminOrAbove || category.createdBy === user?.uid;
            return (
              <TableRow key={category.slug}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${AVATAR_TONES[index % AVATAR_TONES.length]}`}
                    >
                      <Tag className="size-4" />
                    </div>
                    {category.name}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs">
                  <SubcategoryBadgeList subcategories={category.subcategories} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal text-muted-foreground">
                    {jobCounts[category.slug] ?? "-"} jobs
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={category.enabled}
                    disabled={!canEdit}
                    onCheckedChange={async (checked) => {
                      await setCategoryEnabled(category.slug, checked);
                      onChanged();
                    }}
                  />
                </TableCell>
                <TableCell>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEdit(category)}>
                            <Pencil className="size-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {isAdminOrAbove && (
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(category)}>
                            <Trash2 className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
          title={`Delete "${deleting.name}"?`}
          description="Jobs already assigned to this category will keep their denormalized category name but the category record will be gone."
          confirmLabel="Delete"
          destructive
          onConfirm={async () => {
            await deleteCategory(deleting.slug);
            toast.success("Category deleted");
            onChanged();
          }}
        />
      )}
    </>
  );
}
