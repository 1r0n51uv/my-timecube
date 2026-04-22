import { ACTIVITIES as DEFAULT_ACTIVITIES } from "./constants";

function key(username: string) {
  return `timetracking__${username}__activities`;
}

export function loadActivities(username: string): string[] {
  try {
    const raw = localStorage.getItem(key(username));
    if (!raw) return [...DEFAULT_ACTIVITIES];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return [...DEFAULT_ACTIVITIES];
}

export function saveActivities(username: string, activities: string[]) {
  localStorage.setItem(key(username), JSON.stringify(activities));
}