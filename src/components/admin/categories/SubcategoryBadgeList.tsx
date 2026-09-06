"use client";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Subcategory } from "@/types/category";

const MAX_VISIBLE = 3;

/**
 * A category can have 20+ subcategories — rendering them all inline blows
 * out the table row height and makes every other row look inconsistent.
 * Show a fixed handful and push the rest behind a "+N more" popover so
 * every row stays the same height regardless of subcategory count.
 */
export function SubcategoryBadgeList({ subcategories }: { subcategories: Subcategory[] }) {
  if (subcategories.length === 0) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const visible = subcategories.slice(0, MAX_VISIBLE);
  const overflow = subcategories.slice(MAX_VISIBLE);

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((sub) => (
        <Badge key={sub.slug} variant="secondary">
          {sub.name}
        </Badge>
      ))}
      {overflow.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button type="button">
              <Badge
                variant="outline"
                className="cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                +{overflow.length} more
              </Badge>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              All {subcategories.length} subcategories
            </p>
            <div className="flex max-h-56 flex-wrap gap-1 overflow-y-auto">
              {subcategories.map((sub) => (
                <Badge key={sub.slug} variant="secondary">
                  {sub.name}
                </Badge>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
