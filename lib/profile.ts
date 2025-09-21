// lib/profile.ts
export type Club = {
  id: string;
  name: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export const PROFILE = {
  name: "John Doe",
  profilePic: "/images/profile-pic.jpg",
  branch: "CSE", // Add branch here
  clubs: [
    { id: "c1", name: "Computer Science Club" },
    { id: "c2", name: "Music Society" },
    { id: "c3", name: "Drama Club" },
  ] as Club[],
  posts: [
    {
      id: "p1",
      title: "My First Post",
      content: "Excited to join the Computer Science Club!",
      createdAt: "2025-08-01",
    },
    {
      id: "p2",
      title: "Music Society Event",
      content: "Had a great time at last night's jam session.",
      createdAt: "2025-08-15",
    },
  ] as Post[],
};
