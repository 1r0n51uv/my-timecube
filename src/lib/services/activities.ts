import type { ActivitiesPayload } from "@/lib/persistence/types";
import { requestJson } from "./http";

export async function getActivities(username: string): Promise<string[]> {
  const payload = await requestJson<ActivitiesPayload>(
    `/users/${encodeURIComponent(username)}/activities`,
  );

  return payload.activities;
}

export async function saveUserActivities(username: string, activities: string[]): Promise<void> {
  await requestJson<ActivitiesPayload>(`/users/${encodeURIComponent(username)}/activities`, {
    method: "PUT",
    body: JSON.stringify({ activities }),
  });
}
