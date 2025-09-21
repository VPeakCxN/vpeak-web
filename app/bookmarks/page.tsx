"use client";

import { useState, useMemo } from "react";
import { VerifiedUser } from "@/lib/auth/types";

// Mock posts data
const ALL_POSTS = [
  { id: "1", title: "First Post", content: "Hello world!" },
  { id: "2", title: "Another Post", content: "More content here." },
  { id: "3", title: "Learn Next.js", content: "React + SSR magic." },
];

// Mock bookmarked IDs (replace with real user data)
const INITIAL_BOOKMARKS = new Set(["1", "3"]);

export default function HomePage() {
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(INITIAL_BOOKMARKS);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const postsToShow = useMemo(() => {
    if (showBookmarks) {
      return ALL_POSTS.filter((post) => bookmarkedIds.has(post.id));
    }
    return ALL_POSTS;
  }, [showBookmarks, bookmarkedIds]);

  const toggleBookmark = (postId: string) => {
    setBookmarkedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) newSet.delete(postId);
      else newSet.add(postId);
      return newSet;
    });
  };

  return (
        <main className="flex-1 max-w-4xl mx-auto p-6">
          {/* Navigation */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowBookmarks(false)}
              className={`px-4 py-2 rounded ${
                showBookmarks
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setShowBookmarks(true)}
              className={`px-4 py-2 rounded ${
                showBookmarks
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Bookmarks
            </button>
          </div>

          {/* Posts List */}
          {postsToShow.length === 0 ? (
            <p className="text-center text-muted-foreground">
              {showBookmarks ? "No bookmarked posts." : "No posts available."}
            </p>
          ) : (
            postsToShow.map((post) => (
              <div
                key={post.id}
                className="border border-border rounded-lg p-4 mb-4 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-foreground">{post.title}</h3>
                <p className="text-muted-foreground mb-2">{post.content}</p>
                <button
                  onClick={() => toggleBookmark(post.id)}
                  className={`px-3 py-1 rounded ${
                    bookmarkedIds.has(post.id)
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {bookmarkedIds.has(post.id) ? "Remove Bookmark" : "Bookmark"}
                </button>
              </div>
            ))
          )}
        </main>
  );
}
