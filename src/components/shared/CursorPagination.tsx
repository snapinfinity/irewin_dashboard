import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CursorPagination({
  page,
  hasMore,
  hasPrevious,
  onNext,
  onPrevious,
}: {
  page: number;
  hasMore: boolean;
  hasPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button variant="outline" size="sm" onClick={onPrevious} disabled={!hasPrevious}>
        <ChevronLeft className="size-4" />
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">Page {page}</span>
      <Button variant="outline" size="sm" onClick={onNext} disabled={!hasMore}>
        Next
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
