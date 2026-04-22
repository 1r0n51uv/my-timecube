export function getUsernameFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const username = params.get("user");

  return username && username.trim() ? username : null;
}

export function toUserPath(pathname: string, username: string): string {
  const params = new URLSearchParams();
  params.set("user", username);
  return `${pathname}?${params.toString()}`;
}
