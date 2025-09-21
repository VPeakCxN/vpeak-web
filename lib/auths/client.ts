// lib/auth/client.ts
export function displayName(user: any): string {
  return user?.name || user?.username || user?.email || "User";
}

export function getInitials(user: any): string {
  const name = displayName(user);
  return name.charAt(0).toUpperCase();
}