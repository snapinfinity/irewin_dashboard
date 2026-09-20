import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EMPLOYMENT_TYPE_VALUES } from "@/lib/constants";
import type { AggregationEntry } from "@/lib/queries/dashboard";
import type { EmploymentType } from "@/types/job";
import { AllTimeBadge } from "./AllTimeBadge";
import { ChartInfoNote } from "./ChartInfoNote";

// Fixed categorical order — colors are assigned by employment type identity,
// never re-cycled when the filtered set changes.
const SLICE_COLORS: Record<EmploymentType, string> = {
  "full-time": "var(--chart-1)",
  "part-time": "var(--chart-2)",
  contract: "var(--chart-3)",
  internship: "var(--chart-4)",
};

export function JobsByEmploymentTypeChart({ data, totalJobs }: { data: AggregationEntry[]; totalJobs: number }) {
  const emptyTypes = EMPLOYMENT_TYPE_VALUES.length - data.length;
  const note =
    emptyTypes > 0
      ? `${emptyTypes} employment ${emptyTypes === 1 ? "type has" : "types have"} no jobs yet.`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jobs by Employment Type</CardTitle>
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
            <div className="flex items-center gap-4">
              <div className="relative size-36 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="count"
                      nameKey="label"
                      innerRadius="60%"
                      outerRadius="90%"
                      paddingAngle={2}
                      stroke="var(--card)"
                      strokeWidth={2}
                    >
                      {data.map((entry) => (
                        <Cell key={entry.key} fill={SLICE_COLORS[entry.key as EmploymentType]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--popover-foreground)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-semibold">{totalJobs}</span>
                  <span className="text-xs text-muted-foreground">{totalJobs === 1 ? "job" : "jobs"}</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                {data.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-2 text-sm">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: SLICE_COLORS[entry.key as EmploymentType] }}
                    />
                    <span className="flex-1 truncate">{entry.label}</span>
                    <span className="font-medium">{entry.count}</span>
                    <span className="w-10 text-right text-muted-foreground">
                      {Math.round((entry.count / totalJobs) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {note && <ChartInfoNote message={note} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}
