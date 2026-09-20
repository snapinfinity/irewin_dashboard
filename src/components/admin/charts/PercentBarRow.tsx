export function PercentBarRow({ label, count, percent }: { label: string; count: number; percent: number }) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-sm">
      <span className="w-24 shrink-0 truncate" title={label}>
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      <span className="w-4 shrink-0 text-right font-medium">{count}</span>
      <span className="w-10 shrink-0 text-right text-muted-foreground">{percent}%</span>
    </div>
  );
}
