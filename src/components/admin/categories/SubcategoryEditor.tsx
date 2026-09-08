"use client";

import { Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { slugify } from "@/lib/utils/slugify";
import type { Subcategory } from "@/types/category";

export function SubcategoryEditor({
  value,
  onChange,
}: {
  value: Subcategory[];
  onChange: (value: Subcategory[]) => void;
}) {
  function updateName(index: number, name: string) {
    const next = [...value];
    next[index] = { ...next[index], name, slug: slugify(name) };
    onChange(next);
  }

  // Soft-deleted in place (not spliced out) so it can be restored here later.
  function toggleDeleted(index: number, isDeleted: boolean) {
    const next = [...value];
    next[index] = { ...next[index], isDeleted };
    onChange(next);
  }

  function add() {
    onChange([...value, { name: "", slug: "" }]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Subcategories</Label>
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">No subcategories yet.</p>
      )}
      {value.map((sub, index) => (
        <div key={index} className={cn("flex items-center gap-2", sub.isDeleted && "opacity-50")}>
          <Input
            placeholder="e.g. Frontend Developer"
            value={sub.name}
            disabled={sub.isDeleted}
            onChange={(e) => updateName(index, e.target.value)}
          />
          {sub.isDeleted ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Restore"
              onClick={() => toggleDeleted(index, false)}
            >
              <RotateCcw className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Remove"
              onClick={() => toggleDeleted(index, true)}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus className="size-4" />
        Add subcategory
      </Button>
    </div>
  );
}
