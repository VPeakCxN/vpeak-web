"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "../context/AuthContext"

type GithubUser = {
  login: string
  id: number
  avatar_url: string
  html_url: string
  name: string | null
  company: string | null
  blog: string | null
  location: string | null
  email: string | null
  bio: string | null
}

export function Account() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<GithubUser | null>(null)
  const [error, setError] = useState<string | null>(null)
  const token = useMemo(() => {
    // Supabase OAuth sessions commonly include provider_token after OAuth
    // Note: This can vary; if unavailable, show a friendly message.
    return (session as any)?.provider_token || (session as any)?.provider_token?.access_token
  }, [session])

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError("GitHub access token not found in session. Try signing out and back in.")
        return
      }
      try {
        const res = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
        })
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
        const data = (await res.json()) as GithubUser
        setProfile(data)
      } catch (e: any) {
        setError(e?.message ?? "Failed to fetch GitHub profile.")
      }
    }
    run()
  }, [token])

  return (
    <>
      <header className="topbar">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="logo-font" style={{ color: "var(--accent)" }}>
            VPeak
          </span>
          <span className="tagline" aria-hidden="true">
            Account
          </span>
        </div>
      </header>

      <main className="container" style={{ paddingTop: 24 }}>
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <h2 style={{ margin: 0 }}>GitHub Account</h2>
          {error && (
            <p className="tagline" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}
          {!error && !profile && <p className="tagline">Loading…</p>}
          {profile && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={profile.avatar_url || "/placeholder.svg"}
                  alt="GitHub avatar"
                  width={64}
                  height={64}
                  style={{ borderRadius: 12, border: "1px solid var(--border)" }}
                />
                <div>
                  <div style={{ fontSize: 18 }}>{profile.name || profile.login}</div>
                  <a
                    href={profile.html_url}
                    className="tagline"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "var(--accent)" }}
                  >
                    {profile.html_url}
                  </a>
                </div>
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <div>
                  <strong>Username:</strong> {profile.login}
                </div>
                <div>
                  <strong>Email:</strong> {profile.email || "—"}
                </div>
                <div>
                  <strong>Bio:</strong> {profile.bio || "—"}
                </div>
                <div>
                  <strong>Company:</strong> {profile.company || "—"}
                </div>
                <div>
                  <strong>Location:</strong> {profile.location || "—"}
                </div>
                <div>
                  <strong>Website:</strong>{" "}
                  {profile.blog ? (
                    <a href={profile.blog} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
                      {profile.blog}
                    </a>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
