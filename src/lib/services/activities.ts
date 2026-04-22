import type { ActivitiesPayload } from "@/lib/persistence/types";
import { loadActivities, saveActivities } from "@/lib/activities";
import { requestJson } from "./http";

function shouldForceLocalMode() {
  return import.meta.env.VITE_FORCE_LOCAL_API === "true";
}

export async function getActivities(username: string): Promise<string[]> {
  if (shouldForceLocalMode()) {
    return loadActivities(username);
  }

  try {
    const payload = await requestJson<ActivitiesPayload>(
      `/users/${encodeURIComponent(username)}/activities`,
    );

    return payload.activities;
  } catch {
    return loadActivities(username);
  }
}

export async function saveUserActivities(username: string, activities: string[]): Promise<void> {
  if (shouldForceLocalMode()) {
    saveActivities(username, activities);
    return;
  }

  try {
    await requestJson<ActivitiesPayload>(`/users/${encodeURIComponent(username)}/activities`, {
      method: "PUT",
      body: JSON.stringify({ activities }),
    });
  } catch {
    saveActivities(username, activities);
  }
}
