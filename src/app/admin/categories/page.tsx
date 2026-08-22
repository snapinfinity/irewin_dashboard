"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { CategoriesTable } from "@/components/admin/categories/CategoriesTable";
import { CategoryForm } from "@/components/admin/categories/CategoryForm";
import { useDebounce } from "@/hooks/use-debounce";
import { listCategories } from "@/lib/queries/categories";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setCategories(await listCategories());
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(term));
  }, [categories, debouncedSearch]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize jobs into categories and subcategories.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add Category
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Tag}
              title="No categories yet"
              description="Add a category to start organizing job listings."
            />
          ) : (
            <CategoriesTable
              categories={filtered}
              onEdit={(category) => {
                setEditing(category);
                setFormOpen(true);
              }}
              onChanged={refresh}
            />
          )}
        </CardContent>
      </Card>

      {formOpen && (
        <CategoryForm open={formOpen} onOpenChange={setFormOpen} category={editing} onSaved={refresh} />
      )}
    </div>
  );
}
