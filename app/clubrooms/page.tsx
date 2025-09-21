"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VerifiedUser } from "@/lib/auth/types";

type Club = {
  id: string;
  name: string;
  logo: string;
  description: string;
  posts: string[];
  announcements: string[];
  faqs: { q: string; a: string }[];
};

const CLUBS: Club[] = [
  {
    id: "tech",
    name: "Tech Innovators Club",
    logo: "/logos/tech.png",
    description:
      "A community for coders, designers, and builders who love technology and innovation.",
    posts: [
      "Hackathon on 20th Sept",
      "Weekly coding challenge is live!",
      "Tech Talk: AI in 2025 – 25th Sept",
      "App development bootcamp starts next week",
    ],
    announcements: [
      "Recruitment drive closes on 15th Sept",
      "Collaboration with Robotics club announced",
      "New mentorship program launching in October",
    ],
    faqs: [
      { q: "Who can join?", a: "Anyone interested in tech is welcome." },
      { q: "Do I need prior experience?", a: "No, beginners are encouraged!" },
      { q: "What kind of events do you host?", a: "Hackathons, workshops, and tech talks." },
    ],
  },
  {
    id: "arts",
    name: "Arts & Culture Club",
    logo: "/logos/arts.png",
    description:
      "Celebrating creativity through music, dance, drama, and cultural events.",
    posts: [
      "Auditions open for drama team.",
      "Dance workshop next week.",
      "Photography contest submissions open.",
      "Cultural exchange meetup planned in October",
    ],
    announcements: [
      "Annual Fest rehearsals start soon!",
      "Drama team schedule updated.",
      "New art exhibition planned for November.",
    ],
    faqs: [
      { q: "Is there a fee?", a: "No fee, just your passion for art." },
      { q: "Do I need to bring my own instruments?", a: "Only for music-related performances." },
      { q: "Are non-performers welcome?", a: "Yes! Volunteers and organizers are always needed." },
    ],
  },
];

import groupFallback from "@/components/images/group.png"; // fallback logo

export default function ClubsPage() {
  const [user, setUser] = useState<VerifiedUser | null>(null);
  const [activeClub, setActiveClub] = useState(CLUBS[0].id);

  return (
        <main className="flex-1 p-6 bg-background text-foreground">
          <h1
            className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            College Clubs
          </h1>

          {/* Club Selector */}
          <Tabs value={activeClub} onValueChange={setActiveClub}>
            <TabsList className="flex flex-wrap gap-2 mb-6">
              {CLUBS.map((c) => (
                <TabsTrigger
                  key={c.id}
                  value={c.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {c.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {CLUBS.map((c) => (
              <TabsContent key={c.id} value={c.id}>
                <ClubCard club={c} />
              </TabsContent>
            ))}
          </Tabs>
        </main>
  );
}

function ClubCard({ club }: { club: Club }) {
  const hasLogo = !!club.logo;

  return (
    <Card className="shadow-lg max-w-4xl mx-auto">
      <CardHeader className="flex items-center space-x-4 p-6">
        {hasLogo ? (
          <Image
            src={club.logo}
            alt={club.name}
            width={64}
            height={64}
            className="rounded-full border object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = groupFallback.src;
            }}
          />
        ) : (
          <Image
            src={groupFallback}
            alt="Group fallback"
            width={64}
            height={64}
            className="rounded-full border object-cover"
          />
        )}

        <div>
          <CardTitle className="text-2xl text-primary">{club.name}</CardTitle>
          <p className="text-muted-foreground">{club.description}</p>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="posts">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
          </TabsList>

          <TabsContent value="posts">
            {club.posts.length ? (
              <ul className="space-y-2">
                {club.posts.map((p, i) => (
                  <li key={i} className="p-2 border rounded-md">
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="opacity-70">No posts yet.</div>
            )}
          </TabsContent>

          <TabsContent value="announcements">
            {club.announcements.length ? (
              <ul className="space-y-2">
                {club.announcements.map((a, i) => (
                  <li
                    key={i}
                    className="p-2 border-l-4 border-primary bg-muted/30"
                  >
                    {a}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="opacity-70">No announcements.</div>
            )}
          </TabsContent>

          <TabsContent value="faqs">
            {club.faqs.length ? (
              <ul className="space-y-4">
                {club.faqs.map((faq, i) => (
                  <li key={i}>
                    <p className="font-semibold text-primary">{faq.q}</p>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="opacity-70">No FAQs available.</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
