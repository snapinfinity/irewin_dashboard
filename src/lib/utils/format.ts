import type { Timestamp } from "firebase/firestore";

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  "€": "EUR",
  "$": "USD",
  "£": "GBP",
  "₹": "INR",
};

function normalizeCurrency(currency?: string | null): string {
  const c = (currency ?? "").trim();
  return CURRENCY_SYMBOL_MAP[c] ?? (c.toUpperCase() || "EUR");
}

export function formatSalaryRange(
  min: number | null,
  max: number | null,
  currency: string,
): string {
  const options: Intl.NumberFormatOptions = { maximumFractionDigits: 0 };
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat("en-US", {
      ...options,
      style: "currency",
      currency: normalizeCurrency(currency),
    });
  } catch {
    // Unknown currency code: fall back to plain numbers instead of crashing
    formatter = new Intl.NumberFormat("en-US", options);
  }
  if (min != null && max != null) return `${formatter.format(min)} - ${formatter.format(max)}`;
  if (min != null) return `From ${formatter.format(min)}`;
  if (max != null) return `Up to ${formatter.format(max)}`;
  return "Not disclosed";
}

export function timestampToDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  return "toDate" in value ? value.toDate() : value;
}

export function formatDate(value: Timestamp | Date | null | undefined): string {
  const date = timestampToDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

export function formatRelativeDate(value: Timestamp | Date | null | undefined): string {
  const date = timestampToDate(value);
  if (!date) return "-";
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const formatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  if (Math.abs(diffDays) < 1) return "today";
  if (Math.abs(diffDays) < 30) return formatter.format(diffDays, "day");
  const diffMonths = Math.round(diffDays / 30);
  return formatter.format(diffMonths, "month");
}

export function isPastDeadline(value: Timestamp | Date | null | undefined): boolean {
  const date = timestampToDate(value);
  if (!date) return false;
  return date.getTime() < Date.now();
}