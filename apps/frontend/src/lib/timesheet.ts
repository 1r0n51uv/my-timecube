import { DAY_NAMES, MONTHS } from "./constants";
import type { TimeEntry } from "./types";

export function daysInMonth(year: number, month: number): number {
  // month is 1-12
  return new Date(year, month, 0).getDate();
}

export function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDateLabel(year: number, month: number, day: number): string {
  const d = new Date(year, month - 1, day);
  return `${MONTHS[month - 1]} ${day} – ${DAY_NAMES[d.getDay()]}`;
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day).getDay();
  return d === 0 || d === 6;
}

export function totalHours(entries: TimeEntry[]): number {
  return entries.reduce((s, e) => s + (Number(e.hours) || 0), 0);
}

export function formatHoursAsDays(hours: number): string {
  const days = hours / 8;
  const rounded = Math.round(days * 100) / 100;
  return `${hours}h → ${rounded}g`;
}

export interface ActivityBreakdown {
  activity: string;
  halfDays: number; // count in units of 0.5 (sum of full + half-day buckets)
  rawHours: number; // leftover hours that didn't reach a half-day bucket
  totalHours: number;
}

export function periodBreakdown(
  entries: TimeEntry[],
  fromStr: string,
  toStr: string,
): ActivityBreakdown[] {
  // group by (date, activity)
  const groups = new Map<string, number>();
  for (const e of entries) {
    if (!e.activity || !e.hours) continue;
    if (e.date < fromStr || e.date > toStr) continue;
    const k = `${e.date}__${e.activity}`;
    groups.set(k, (groups.get(k) || 0) + Number(e.hours));
  }

  const result = new Map<string, ActivityBreakdown>();
  for (const [k, hours] of groups.entries()) {
    const activity = k.split("__")[1];
    const cur = result.get(activity) || { activity, halfDays: 0, rawHours: 0, totalHours: 0 };
    // Per day: cap day at 8h → 1g; if 4-7h → 0.5g + leftover; <4h → raw
    let h = hours;
    if (h >= 8) {
      cur.halfDays += 1;
      h -= 8;
    } else if (h >= 4) {
      cur.halfDays += 0.5;
      h -= 4;
    }
    cur.rawHours += h;
    cur.totalHours += hours;
    result.set(activity, cur);
  }

  return Array.from(result.values()).sort((a, b) => a.activity.localeCompare(b.activity));
}

/** Format like "1g 1h", "0.5g", "3h", or "—" */
export function formatHalfDays(b: { halfDays: number; rawHours: number }): string {
  const parts: string[] = [];
  if (b.halfDays > 0) parts.push(`${b.halfDays}g`);
  if (b.rawHours > 0) parts.push(`${b.rawHours}h`);
  return parts.length ? parts.join(" ") : "—";
}
