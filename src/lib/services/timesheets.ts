import type { TimeEntry, TimesheetPayload } from "@/lib/persistence/types";
import { requestJson } from "./http";

export async function getTimesheetEntries(
  username: string,
  year: number,
  month: number,
): Promise<TimeEntry[]> {
  const payload = await requestJson<TimesheetPayload>(
    `/users/${encodeURIComponent(username)}/timesheets?year=${year}&month=${month}`,
  );

  return payload.entries;
}

export async function saveTimesheetEntries(
  username: string,
  year: number,
  month: number,
  entries: TimeEntry[],
): Promise<void> {
  await requestJson<TimesheetPayload>(
    `/users/${encodeURIComponent(username)}/timesheets?year=${year}&month=${month}`,
    {
      method: "PUT",
      body: JSON.stringify({ entries }),
    },
  );
}
