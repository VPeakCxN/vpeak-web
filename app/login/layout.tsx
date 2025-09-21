// app/login/layout.tsx
"use client";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ❌ REMOVE THE useEffect - this causes infinite re-renders
  // ✅ Keep it simple - let the server handle auth checks

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      {children}
    </main>
  );
}