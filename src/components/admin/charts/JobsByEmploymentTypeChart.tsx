"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMPLOYMENT_TYPE_LABELS, EMPLOYMENT_TYPE_VALUES } from "@/lib/constants";
import type { AggregationEntry } from "@/lib/queries/dashboard";
import type { EmploymentType } from "@/types/job";

// Fixed categorical order — colors are assigned by employment type identity,
// never re-cycled when the filtered set changes.
const SLICE_COLORS: Record<EmploymentType, string> = {
  "full-time": "var(--chart-1)",
  "part-time": "var(--chart-2)",
  contract: "var(--chart-3)",
  internship: "var(--chart-4)",
};

export function JobsByEmploymentTypeChart({ data }: { data: AggregationEntry[] }) {
  const byKey = new Map(data.map((entry) => [entry.key, entry.count]));
  const chartData = EMPLOYMENT_TYPE_VALUES.map((value) => ({
    key: value,
    label: EMPLOYMENT_TYPE_LABELS[value],
    count: byKey.get(value) ?? 0,
  })).filter((entry) => entry.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jobs by Employment Type</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        {chartData.length === 0 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No job data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                stroke="var(--card)"
                strokeWidth={2}
              >
                {chartData.map((entry) => (
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
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
