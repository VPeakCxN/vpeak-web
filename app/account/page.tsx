import { redirect } from "next/navigation";
import { getTokenFromCookie, getUserFromCookie } from "@/lib/authss";
import AccountClient from "./account-client";

export default async function AccountPage() {
  const token = await getTokenFromCookie();
  const user = await getUserFromCookie();
  
  if (!token || !user) {
    redirect("/login");
  }

  return <AccountClient user={user} />;
}
