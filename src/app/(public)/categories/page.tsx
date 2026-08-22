"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { listCategories } from "@/lib/queries/categories";
import { getCategoryJobCount } from "@/lib/queries/jobs";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then(async (cats) => {
      const enabled = cats.filter((c) => c.enabled);
      setCategories(enabled);
      const entries = await Promise.all(
        enabled.map((c) => getCategoryJobCount(c.slug).then((count) => [c.slug, count] as const)),
      );
      setCounts(Object.fromEntries(entries));
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Categories</h1>
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon={Tag} title="No categories yet" description="Check back soon." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link key={category.slug} href={`/categories/${category.slug}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{counts[category.slug] ?? 0} jobs</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
