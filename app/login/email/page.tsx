import { redirect } from "next/navigation";

import { getTokenFromCookie } from "@/lib/authss";

import { LoginEmail }from "./LoginEmail";

export default async function LoginEmailPage() {
  const token = await getTokenFromCookie();
  if (token) {
    redirect("/home");
  }

  return <LoginEmail />;
}