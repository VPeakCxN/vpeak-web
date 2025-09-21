// app/marketplace/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { VerifiedUser } from "@/lib/auth/types";
type Listing = {
  id: string;
  title: string;
  price: string;
  image: string;
  createdAt: string;
  tags: string[];
};

const MOCK: Listing[] = [
  {
    id: "1",
    title: "Vintage Lamp",
    price: "₹200",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTV4TpmTy-bkckjygCtJhNLFfEaMgvCmV5bOA&s",
    createdAt: "2025-09-10",
    tags: ["lighting", "vintage", "home"],
  },
  {
    id: "2",
    title: "Wooden Chair",
    price: "₹45",
    image: "https://d2emch4msrhe87.cloudfront.net/image/cache/data/arm-chairs/siegler-sheesham-wood-cane-arm-chair/honey-finish/updated/product/honry-810x702.jpg",
    createdAt: "2025-09-09",
    tags: ["furniture", "wood", "seating"],
  },
  {
    id: "3",
    title: "Ceramic Vase",
    price: "₹120",
    image: "https://nestasia.in/cdn/shop/files/FlowerVase_7.jpg?v=1695207441&width=600",
    createdAt: "2025-09-08",
    tags: ["decor", "ceramic", "vase"],
  },
  {
    id: "4",
    title: "Succulent Plant",
    price: "₹120",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZPrRQos5HGLXxpbY7ZvPPZVV-RAb-OUCk7Q&s",
    createdAt: "2025-09-07",
    tags: ["plant", "greenery", "home"],
  },
  {
    id: "5",
    title: "Coffee Table",
    price: "₹400",
    image: "https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRpH6tRHeIM4f2_4pzGprBeUC6G-BNMUaJe6d2Emmf8AShw1s2MfqUVZDRjifs0mr4m2ktKoQh0V4BXw3RiOc-Qs7blFc83",
    createdAt: "2025-09-06",
    tags: ["furniture", "table", "living room"],
  },
];

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<Listing[]>([]);
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

  useEffect(() => {
    // simulate fetch
    setListings(MOCK);
  }, []);

  const filtered = useMemo(() => {
    return listings
      .filter((item) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [listings, query]);

  return (
    <>
      {error && <div>{error}</div>}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.h1
          className="text-3xl font-bold mb-6 text-foreground"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Marketplace
        </motion.h1>

        {/* Search bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="
              w-full max-w-md px-4 py-2 border border-border rounded-lg
              focus:outline-none focus:ring-2 focus:ring-ring
              bg-background text-foreground placeholder:text-muted-foreground
            "
          />
        </div>

        {/* Listings grid */}
        <AnimatePresence mode="popLayout">
          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filtered.map(({ id, title, price, image, createdAt, tags }) => (
              <motion.div
                key={id}
                className="
                  bg-card border border-border rounded-xl overflow-hidden shadow-sm
                  hover:shadow-lg transition-shadow duration-200
                "
                whileHover={{ scale: 1.03 }}
              >
                <div className="h-40 w-full bg-gray-100">
                  <img
                    src={image}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    {title}
                  </h2>
                  <p className="text-secondary-foreground text-sm mb-2">
                    Posted on {new Date(createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-primary font-medium mb-2">{price}</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="
                          text-[0.75rem] bg-secondary/20 text-secondary-foreground
                          px-2 py-1 rounded-full
                        "
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground">
                No items match your search.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}