"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StringListEditor({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  function update(index: number, next: string) {
    const copy = [...value];
    copy[index] = next;
    onChange(copy);
  }

  function remove(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...value, ""]);
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input placeholder={placeholder} value={item} onChange={(e) => update(index, e.target.value)} />
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(index)}>
            <X className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-fit" onClick={add}>
        <Plus className="size-4" />
        Add
      </Button>
    </div>
  );
}
