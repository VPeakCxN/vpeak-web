"use server";

import { signInWithGoogle } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

export async function signInWithGoogleAction() {
  try {
    // This will redirect to Google's OAuth page
    redirect(await signInWithGoogle());
  } catch (error) {
    console.error("Sign in action error:", error);
    throw new Error("Failed to initiate Google sign-in");
  }
}