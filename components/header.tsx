// app/components/header.tsx
import { SiteHeaderClient } from "./header.client";

export default function SiteHeader() {
  // This is a server component; we won't handle cookies here as they are client-side.
  // Pass minimal props if needed, but logic will be handled in the client component.
  return <SiteHeaderClient />;
}
