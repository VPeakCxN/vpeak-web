// app/components/header.tsx
import { SiteHeaderClient } from "./header.client";
import type { AppUser } from "@/lib/auths/types";

export default function SiteHeader({ user }: { user: AppUser | null }) {
  const headerUser = user
    ? {
        name: user.student?.name ?? user.username ?? user.email ?? "User",
        image: user.avatar_url ?? undefined,
      }
    : null;

  return <SiteHeaderClient user={headerUser} />;
}