import type { LucideIcon } from "lucide-react";

const TONE_STYLES = {
  rose: { card: "bg-[#fdedf0]", icon: "bg-[#f43f5e] text-white" },
  amber: { card: "bg-[#fdf1e2]", icon: "bg-[#f97316] text-white" },
  emerald: { card: "bg-[#e6f9ec]", icon: "bg-[#22c55e] text-white" },
  violet: { card: "bg-[#ece9fc]", icon: "bg-[#4f46e5] text-white" },
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "violet",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: keyof typeof TONE_STYLES;
}) {
  const styles = TONE_STYLES[tone];

  return (
    <div className={`rounded-xl p-4 shadow-[0_1px_2px_rgba(28,24,48,0.04)] ${styles.card}`}>
      <div className={`mb-3 flex size-9 items-center justify-center rounded-full ${styles.icon}`}>
        <Icon className="size-4" />
      </div>
      <p className="text-2xl font-semibold leading-none tracking-tight text-foreground">{value}</p>
      <p className="mt-1.5 text-sm text-foreground/70">{label}</p>
    </div>
  );
}
