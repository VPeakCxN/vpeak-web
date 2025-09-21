"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent} from "@/components/ui/tabs"


type Item = { dish: string; notes?: string };
type MenuDay = { breakfast: Item[]; lunch: Item[]; snacks: Item[]; dinner: Item[] };
type MenusByDay = Record<string, MenuDay>;

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const MENUS: MenusByDay = {
  Mon: {
    breakfast: [{ dish: "Idli & Sambar" }, { dish: "Tea" }],
    lunch: [{ dish: "Veg Thali" }, { dish: "Curd" }],
    snacks: [{ dish: "Samosa" }, { dish: "Tea" }],
    dinner: [{ dish: "Veg Biryani" }, { dish: "Salad" }],
  },
  Tue: {
    breakfast: [{ dish: "Poha" }, { dish: "Milk" }],
    lunch: [{ dish: "Rajma Chawal" }],
    snacks: [{ dish: "Pakora" }, { dish: "Coffee" }],
    dinner: [{ dish: "Roti + Paneer Butter Masala" }],
  },
  Wed: {
    breakfast: [{ dish: "Upma" }],
    lunch: [{ dish: "Sambar Rice" }],
    snacks: [{ dish: "Vada Pav" }],
    dinner: [{ dish: "Fried Rice + Gobi Manchurian" }],
  },
  Thu: {
    breakfast: [{ dish: "Dosa + Chutney" }],
    lunch: [{ dish: "Chole Bhature" }],
    snacks: [{ dish: "Pani Puri" }],
    dinner: [{ dish: "Curd Rice + Pickle" }],
  },
  Fri: {
    breakfast: [{ dish: "Aloo Paratha + Curd" }],
    lunch: [{ dish: "Dal Tadka + Rice" }],
    snacks: [{ dish: "Bhajji" }],
    dinner: [{ dish: "Pulao + Raita" }],
  },
  Sat: {
    breakfast: [{ dish: "Pongal + Vada" }],
    lunch: [{ dish: "Mixed Veg Curry + Roti" }],
    snacks: [{ dish: "Masala Fries" }],
    dinner: [{ dish: "Noodles + Sauce" }],
  },
  Sun: {
    breakfast: [{ dish: "Masala Dosa" }],
    lunch: [{ dish: "Pav Bhaji" }],
    snacks: [{ dish: "Bhel Puri" }],
    dinner: [{ dish: "Chapati + Kadai Paneer" }],
  },
};

function todayLabel() {
  const idx = new Date().getDay(); // 0 Sun..6 Sat
  return DAYS[(idx + 6) % 7];
}

const MEAL_TIMINGS: Record<string, string> = {
  Breakfast: "7:00 - 9:00 AM",
  Lunch: "12:30 - 2:30 PM",
  Snacks: "4:30 - 6:15 PM",
  Dinner: "7:00 - 9:00 PM",
};

export default function MessMenuPage() {
  const [day, setDay] = useState(todayLabel());
  const menu = useMemo(() => MENUS[day] ?? null, [day]);

  return (
        <main className="flex-1 p-6 flex flex-col items-center bg-background text-foreground">
          <h1
            className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            Weekly Mess Menu
          </h1>

          <Card className="w-full max-w-4xl shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Menu Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={day} onValueChange={setDay}>
                <TabsList className="grid w-full grid-cols-7 mb-4">
                  {DAYS.map((d) => (
                    <TabsTrigger
                      key={d}
                      value={d}
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      {d}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value={day}>
                  {!menu ? (
                    <div className="opacity-70">No menu available.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <MenuCard title="Breakfast" items={menu.breakfast} />
                      <MenuCard title="Lunch" items={menu.lunch} />
                      <MenuCard title="Dinner" items={menu.dinner} />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
  );
}

function MenuCard({ title, items }: { title: string; items: Item[] }) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="p-4">
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">Today</p>
      </CardHeader>
      <CardContent className="p-4">
        <ul className="space-y-2">
          {items.map((it, idx) => (
            <li key={idx} className="text-foreground">
              {it.dish}
              {it.notes ? ` — ${it.notes}` : ""}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
