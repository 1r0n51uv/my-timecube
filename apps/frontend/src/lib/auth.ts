import { useSyncExternalStore } from "react";

const KEY = "currentUser";
const AUTH_EVENT = "my-timecube-auth-change";

export function getCurrentUser(): string | null {
  return window.sessionStorage.getItem(KEY);
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function setCurrentUser(username: string) {
  window.sessionStorage.setItem(KEY, username);
  notifyAuthChange();
}

export function clearCurrentUser() {
  window.sessionStorage.removeItem(KEY);
  notifyAuthChange();
}

export function isAllowedUser(username: string, allowedUsers: readonly string[]): boolean {
  return allowedUsers.includes(username);
}

export function isAdminUser(
  username: string | null | undefined,
  adminUsers: readonly string[],
): boolean {
  return !!username && adminUsers.includes(username);
}

function subscribeCurrentUser(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      callback();
    }
  };

  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useCurrentUser() {
  return useSyncExternalStore(subscribeCurrentUser, getCurrentUser, () => null);
}
