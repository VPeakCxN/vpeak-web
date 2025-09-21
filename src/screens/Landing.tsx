import { Link } from "react-router-dom"

export function Landing() {
  return (
    <main className="container" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <section style={{ display: "grid", gap: 16, textAlign: "center", maxWidth: 720 }}>
        <h1 className="logo-font" style={{ fontSize: 40, color: "var(--accent)" }}>
          VPeak
        </h1>
        <p className="tagline">Advanced analytics and insights for educational institutions.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link className="btn btn-accent" to="/signin" aria-label="Go to sign in">
            Sign In
          </Link>
        </div>
      </section>
    </main>
  )
}
