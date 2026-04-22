export function isAdminUser(user: { isAdmin: boolean } | null | undefined): boolean {
  return !!user?.isAdmin;
}
