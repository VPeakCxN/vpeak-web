export type Listing = {
  id: string;
  title: string;
  price: string;
  image: string;
  createdAt: string;
  tags: string[];
  description: string;
  postedBy: string;
  location: string;
};

export const LISTINGS: Listing[] = [
  {
    id: "1",
    title: "Vintage Lamp",
    price: "$25",
    image: "/images/lamp.jpg",
    createdAt: "2025-09-10",
    tags: ["lighting", "vintage", "home"],
    description:
      "A charming vintage lamp in good working condition. Perfect for adding warm ambient light to any room.",
    postedBy: "Alice Johnson",
    location: "Downtown Campus",
  },
  {
    id: "2",
    title: "Wooden Chair",
    price: "$45",
    image: "/images/chair.jpg",
    createdAt: "2025-09-09",
    tags: ["furniture", "wood", "seating"],
    description:
      "Solid wood chair with a classic design. Minor wear on the seat, sturdy and comfortable.",
    postedBy: "Bob Smith",
    location: "North Campus",
  },
  // …other listings…
];
