import { ALLOWED_USERS } from "./constants";

const KEY = "currentUser";

export function getCurrentUser(): string | null {
  return localStorage.getItem(KEY);
}

export function setCurrentUser(username: string) {
  localStorage.setItem(KEY, username);
}

export function clearCurrentUser() {
  localStorage.removeItem(KEY);
}

export function isAllowedUser(username: string): boolean {
  return (ALLOWED_USERS as readonly string[]).includes(username);
}