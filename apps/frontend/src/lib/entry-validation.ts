import type { TimeEntry } from "./types";

export function isCompleteTimeEntry(entry: TimeEntry) {
  return entry.activity.trim().length > 0 && entry.hours > 0;
}
