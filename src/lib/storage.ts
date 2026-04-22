import type { TimeEntry } from "./persistence/types";

function key(username: string, year: number, month: number) {
  return `timetracking__${username}__${year}__${String(month).padStart(2, "0")}`;
}

export function loadEntries(username: string, year: number, month: number): TimeEntry[] {
  try {
    const raw = localStorage.getItem(key(username, year, month));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEntries(username: string, year: number, month: number, entries: TimeEntry[]) {
  localStorage.setItem(key(username, year, month), JSON.stringify(entries));
}

export type { TimeEntry };
