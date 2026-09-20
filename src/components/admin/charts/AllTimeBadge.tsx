// Static for now — every dashboard query already covers all-time data, so
// this just labels that. Wire it up to a real range picker if/when the
// underlying queries support filtering by date range.
export function AllTimeBadge() {
  return (
    <span className="rounded-md border px-2.5 py-1 text-xs font-medium text-muted-foreground">All time</span>
  );
}
