// app/login/email/actions.ts

"use server";

import { redirect } from "next/navigation";
import { signInWithEmail } from "@/lib/auth/actions";

export async function signInWithEmailAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // The redirect call from signInWithEmail will automatically handle the redirection.
  // The NEXT_REDIRECT error is part of this process and should not be caught.
  await signInWithEmail(email, password);
  redirect("/");
}