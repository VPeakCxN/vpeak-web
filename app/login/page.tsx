// app/login/page.tsx
import { redirect } from "next/navigation";
import { LoginClient } from "./LoginClient";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  try {
    // Quick check using your verify endpoint
    const response = await fetch("/api/auth/session/verify", {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    const data = await response.json();

    if (data.valid) {
      console.log("✅ Already authenticated, redirecting to dashboard");
      redirect("/dashboard");
    }
  } catch (error) {
    console.log("🔍 Not authenticated or verify failed, showing login");
  }

  return <LoginClient />;
}