// app/login/page.tsx
import { redirect } from "next/navigation";
import { getTokenFromCookie } from "@/lib/auth";
import { LoginClient } from "./LoginClient";
export default async function LoginPage() {
  const token = await getTokenFromCookie();
  if (token) {
    redirect("/home");
  }

  return <LoginClient />;
}