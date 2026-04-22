const KEY = "currentUser";

export function getCurrentUser(): string | null {
  return window.sessionStorage.getItem(KEY);
}

export function setCurrentUser(username: string) {
  window.sessionStorage.setItem(KEY, username);
}

export function clearCurrentUser() {
  window.sessionStorage.removeItem(KEY);
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
