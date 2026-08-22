import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types/category";

export function CategoryChipList({ categories }: { categories: Category[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <Link key={category.slug} href={`/categories/${category.slug}`}>
          <Badge variant="secondary" className="cursor-pointer px-3 py-1.5 text-sm hover:bg-muted">
            {category.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
