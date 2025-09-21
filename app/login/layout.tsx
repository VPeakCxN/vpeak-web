// app/login/layout.tsx
'use client'
import { useState, useEffect } from "react";
import { VerifiedUser } from "@/lib/auths/types";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err);
      });
  }, []);

  return (
    <>
      {error && <div>{error}</div>}
        <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
          {children}
        </main>
    </>
  );
}