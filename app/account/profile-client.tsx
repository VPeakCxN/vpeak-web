"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/browser"

type Profile = {
  login?: string
  name?: string
  email?: string
  avatar_url?: string
  html_url?: string
}

export default function AccountClient() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const supabase = getSupabaseBrowser()
        const { data } = await supabase.auth.getSession()
        const session = data.session
        const providerToken = (session as any)?.provider_token || (session as any)?.provider_token?.access_token
        // Fallback to user metadata if no provider token exposed
        if (providerToken) {
          const res = await fetch("https://api.github.com/user", {
            headers: { Authorization: `Bearer ${providerToken}` },
          })
          if (!res.ok) throw new Error(`GitHub API error ${res.status}`)
          const gh = await res.json()
          setProfile({
            login: gh.login,
            name: gh.name,
            email: gh.email,
            avatar_url: gh.avatar_url,
            html_url: gh.html_url,
          })
        } else {
          const { data: udata } = await supabase.auth.getUser()
          const u = udata.user
          const meta = (u?.user_metadata as any) || {}
          setProfile({
            login: meta.user_name || meta.preferred_username,
            name: meta.full_name,
            email: u?.email || undefined,
            avatar_url: meta.avatar_url,
            html_url: meta.html_url || undefined,
          })
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load profile")
      }
    })()
  }, [])

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-12 space-y-6">
        <h1 className="text-3xl font-semibold text-primary font-brand">Account</h1>

        {error ? <p className="text-destructive">{error}</p> : null}

        {profile ? (
          <div className="grid gap-4">
            <div>
              <div className="text-muted-foreground text-sm">Username / Login</div>
              <div className="text-foreground">{profile.login || "-"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Name</div>
              <div className="text-foreground">{profile.name || "-"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Email</div>
              <div className="text-foreground">{profile.email || "-"}</div>
            </div>
            <div>
              <div className="text-muted-foreground text-sm">Profile</div>
              {profile.html_url ? (
                <a href={profile.html_url} target="_blank" rel="noreferrer" className="text-primary underline">
                  {profile.html_url}
                </a>
              ) : (
                <div className="text-foreground">-</div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Loading...</p>
        )}
      </div>
    </main>
  )
}
