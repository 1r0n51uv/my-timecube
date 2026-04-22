import type { TimeEntry, TimesheetPayload } from "@/lib/persistence/types";
import { loadEntries, saveEntries } from "@/lib/storage";
import { requestJson } from "./http";

function shouldForceLocalMode() {
  return import.meta.env.VITE_FORCE_LOCAL_API === "true";
}

export async function getTimesheetEntries(
  username: string,
  year: number,
  month: number,
): Promise<TimeEntry[]> {
  if (shouldForceLocalMode()) {
    return loadEntries(username, year, month);
  }

  try {
    const payload = await requestJson<TimesheetPayload>(
      `/users/${encodeURIComponent(username)}/timesheets?year=${year}&month=${month}`,
    );

    return payload.entries;
  } catch {
    return loadEntries(username, year, month);
  }
}

export async function saveTimesheetEntries(
  username: string,
  year: number,
  month: number,
  entries: TimeEntry[],
): Promise<void> {
  if (shouldForceLocalMode()) {
    saveEntries(username, year, month, entries);
    return;
  }

  try {
    await requestJson<TimesheetPayload>(
      `/users/${encodeURIComponent(username)}/timesheets?year=${year}&month=${month}`,
      {
        method: "PUT",
        body: JSON.stringify({ entries }),
      },
    );
  } catch {
    saveEntries(username, year, month, entries);
  }
}
