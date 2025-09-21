import type { Metadata } from "next";
import { Inter, Chewy } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import SiteHeader from "@/app/components/header";
import { SiteFooter } from "@/app/components/footer";
import type { AppUser, Student, VerifiedUser } from "@/lib/auths/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import ClientLayout from "./ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const chewy = Chewy({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-brand",
});

export const metadata: Metadata = {
  title: "VPeak – Unified Campus Platform",
  description:
    "A unified campus platform bringing academics, social life, and official communications into one student-first web app.",
  icons: {
    icon: "/logo.ico",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  // Fetch user profile (student) and verified user info
  let headerUser: AppUser | null = null;

  if (currentUser) {
    const { data: studentRow } = await supabase
      .from("students")
      .select("uid, name, regno, dob, dept, personal_email, phone")
      .eq("uid", currentUser.id)
      .maybeSingle();

    const verified: VerifiedUser = {
      uid: currentUser.id,
      supabase_user_id: currentUser.id,
      email: currentUser.email ?? null,
      username:
        currentUser.user_metadata?.preferred_username ??
        currentUser.user_metadata?.username ??
        null,
      avatar_url: currentUser.user_metadata?.avatar_url ?? null,
      roles: Array.isArray(currentUser.user_metadata?.roles)
        ? currentUser.user_metadata.roles
        : [],
      permissions: Array.isArray(currentUser.user_metadata?.permissions)
        ? currentUser.user_metadata.permissions
        : [],
    };

    headerUser = { ...verified, student: (studentRow as Student | null) ?? null };
  }

  // Find display name and avatar initial
  const displayName =
    headerUser?.student?.name ??
    headerUser?.username ??
    headerUser?.email ??
    "User";
  const initial =
    headerUser?.student?.name?.charAt(0) ??
    headerUser?.email?.charAt(0) ??
    "U";

  return (
    <html lang="en" className={`${inter.variable} ${chewy.variable}`}>
      <body className="font-sans antialiased">
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <SiteHeader user={headerUser} />
          <ClientLayout>
            <Providers>{children}</Providers>
            <Toaster richColors position="top-right" />
          </ClientLayout>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}