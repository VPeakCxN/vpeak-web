import { redirect } from "next/navigation";
import { LoginClient } from "./LoginClient";

export default async function LoginPage() {
  try {
    // Quick check using your verify endpoint
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/session/verify`, {
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