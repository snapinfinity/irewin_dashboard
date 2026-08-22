"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    next[index] = { name, slug: slugify(name) };
    onChange(next);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
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
        <div key={index} className="flex items-center gap-2">
          <Input
            placeholder="e.g. Frontend Developer"
            value={sub.name}
            onChange={(e) => updateName(index, e.target.value)}
          />
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus className="size-4" />
        Add subcategory
      </Button>
    </div>
  );
}
