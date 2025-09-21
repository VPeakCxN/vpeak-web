"use client"
import { useAuth } from "../context/AuthContext"

export function SignIn() {
  const { signInWithGithub } = useAuth()

  return (
    <main className="container" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <section className="card" style={{ maxWidth: 520, width: "100%", display: "grid", gap: 16 }}>
        <div style={{ textAlign: "center", display: "grid", gap: 8 }}>
          <h1 className="logo-font" style={{ fontSize: 32, color: "var(--accent)" }}>
            VPeak
          </h1>
          <p className="tagline">Sign in to continue</p>
        </div>
        <button
          className="btn"
          onClick={signInWithGithub}
          aria-label="Sign in with GitHub"
          style={{ justifyContent: "center" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M12 2C6.475 2 2 6.59 2 12.253c0 4.537 2.865 8.383 6.84 9.742.5.095.682-.223.682-.497 0-.245-.01-1.046-.014-1.898-2.782.619-3.37-1.205-3.37-1.205-.455-1.176-1.112-1.49-1.112-1.49-.91-.637.07-.624.07-.624 1.005.073 1.534 1.06 1.534 1.06.894 1.567 2.347 1.115 2.918.853.09-.664.35-1.115.636-1.372-2.22-.258-4.555-1.145-4.555-5.094 0-1.125.386-2.045 1.02-2.765-.103-.258-.442-1.3.098-2.706 0 0 .836-.273 2.74 1.056A9.34 9.34 0 0 1 12 6.844c.847.004 1.7.118 2.496.345 1.903-1.329 2.738-1.056 2.738-1.056.542 1.406.203 2.448.1 2.706.636.72 1.018 1.64 1.018 2.765 0 3.959-2.34 4.833-4.566 5.086.359.319.679.947.679 1.909 0 1.377-.012 2.486-.012 2.824 0 .276.18.596.688.495A10.02 10.02 0 0 0 22 12.253C22 6.59 17.523 2 12 2Z"
              clipRule="evenodd"
            />
          </svg>
          <span>Sign in with GitHub</span>
        </button>
      </section>
    </main>
  )
}
