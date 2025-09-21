"use client"
import { useAuth } from "../context/AuthContext"
import { ProfileMenu } from "../components/ProfileMenu"

export function Dashboard() {
  const { user } = useAuth()
  const name =
    (user?.user_metadata as any)?.name ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.user_name ||
    user?.email ||
    "there"

  return (
    <>
      <header className="topbar">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="logo-font" style={{ color: "var(--accent)" }}>
            VPeak
          </span>
          <span className="tagline" aria-hidden="true">
            Dashboard
          </span>
        </div>
        <ProfileMenu />
      </header>

      <main className="container" style={{ paddingTop: 24 }}>
        <div className="card" style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0 }}>Hello {name} 👋</h2>
          <p className="tagline">Welcome back. Analyze smarter with insights.</p>
        </div>
      </main>
    </>
  )
}
