// app/profile/page.tsx
'use client'
import { useState, useEffect } from "react";
import Image from 'next/image'
import { PROFILE, Club, Post } from '@/lib/profile'
import { VerifiedUser } from "@/lib/auth/types";
import Avatar from "../components/Avatar";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ProfilePage() {
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

  const { name, profilePic, clubs, posts, branch } = PROFILE

  return (
    <>
      {error && <div>{error}</div>}
        <main className="flex-1 p-6">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              src={profilePic}
              alt={name}
              width={80}
              height={80}
              className="rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              {branch && <p className="text-muted-foreground">{branch}</p>}
            </div>
          </div>

          {/* Clubs section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Clubs</h2>
            {clubs.length === 0 ? (
              <p>You are not part of any clubs yet.</p>
            ) : (
              <ul className="space-y-2">
                {clubs.map((club: Club) => (
                  <li key={club.id} className="border p-4 rounded-lg">
                    {club.name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Posts section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Your Posts</h2>
            {posts.length === 0 ? (
              <p>You haven't made any posts yet.</p>
            ) : (
              <ul className="space-y-4">
                {posts.map((post: Post) => (
                  <li key={post.id} className="border p-4 rounded-lg">
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
                    <p>{post.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
    </>
  )
}