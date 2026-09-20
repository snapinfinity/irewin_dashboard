import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AggregationEntry } from "@/lib/queries/dashboard";
import { AllTimeBadge } from "./AllTimeBadge";
import { ChartInfoNote } from "./ChartInfoNote";
import { PercentBarRow } from "./PercentBarRow";

export function JobsByCategoryChart({
  data,
  totalJobs,
  totalCategories,
}: {
  data: AggregationEntry[];
  totalJobs: number;
  totalCategories: number;
}) {
  const emptyCategories = totalCategories - data.length;
  const note =
    emptyCategories > 0
      ? `${emptyCategories} ${emptyCategories === 1 ? "category" : "categories"} ${emptyCategories === 1 ? "has" : "have"} no jobs yet.`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jobs by Category</CardTitle>
        <CardDescription>Share of {totalJobs} total jobs</CardDescription>
        <CardAction>
          <AllTimeBadge />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {totalJobs === 0 ? (
          <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">No job data yet.</p>
        ) : (
          <>
            <div className="flex flex-col divide-y">
              {data.map((entry) => (
                <PercentBarRow
                  key={entry.key}
                  label={entry.label}
                  count={entry.count}
                  percent={Math.round((entry.count / totalJobs) * 100)}
                />
              ))}
            </div>
            {note && <ChartInfoNote message={note} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}
