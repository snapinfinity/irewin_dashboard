import { MapPin } from "lucide-react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AggregationEntry } from "@/lib/queries/dashboard";
import { AllTimeBadge } from "./AllTimeBadge";
import { PercentBarRow } from "./PercentBarRow";

export function JobsByLocationChart({ data, totalJobs }: { data: AggregationEntry[]; totalJobs: number }) {
  // data is already sorted descending by count (see getJobsAggregations).
  const top = data[0];
  const topPercent = top ? Math.round((top.count / totalJobs) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jobs by Location</CardTitle>
        <CardDescription>Share of {totalJobs} total jobs</CardDescription>
        <CardAction>
          <AllTimeBadge />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {totalJobs === 0 || !top ? (
          <p className="flex h-32 items-center justify-center text-sm text-muted-foreground">No job data yet.</p>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MapPin className="size-4" />
                </span>
                <div>
                  <p className="font-medium">{top.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {top.count} of {totalJobs} jobs
                  </p>
                </div>
              </div>
              <span className="text-2xl font-semibold text-primary">{topPercent}%</span>
            </div>

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
          </>
        )}
      </CardContent>
    </Card>
  );
}
