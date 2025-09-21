'use client'
import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LISTINGS } from "@/lib/listings";
import { VerifiedUser } from "@/lib/auth/types";

export default function ListingPage({ params }: { params: { id: string } }) {
  const listing = LISTINGS.find((l) => l.id === params.id);
  if (!listing) notFound();

  const date = new Date(listing.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
          <main className="flex-1">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              <Link href="/marketplace" className="text-sm text-primary hover:underline">
                ← Back to Marketplace
              </Link>

              <div className="w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-baseline justify-between">
                <h1 className="text-2xl font-bold text-foreground">{listing.title}</h1>
                <span className="text-2xl font-semibold text-primary">{listing.price}</span>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div>Posted on {date}</div>
                <div>By {listing.postedBy}</div>
                <div>Location: {listing.location}</div>
              </div>

              <section className="prose prose-sm text-foreground">
                <h2 className="sr-only">Description</h2>
                <p>{listing.description}</p>
              </section>

              <button
                className="inline-block px-6 py-3 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition"
              >
                Send Message
              </button>
            </div>
          </main>
    </>
  );
}