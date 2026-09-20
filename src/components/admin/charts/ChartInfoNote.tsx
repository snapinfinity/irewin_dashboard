import { Info } from "lucide-react";

/** Contextual note shown under a breakdown list when the data is too thin or too uniform for a chart to say anything useful. */
export function ChartInfoNote({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
      <Info className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
