"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VerifiedUser } from "@/lib/auth/types";

// Sample data for each day (can be customized per day)
const timetableData = {
  Monday: [
    { time: "08:00 AM - 09:00 AM", subject: "Mathematics", room: "Room 101", professor: "Dr. Alice Johnson" },
    { time: "09:15 AM - 10:15 AM", subject: "Physics", room: "Room 202", professor: "Prof. Bob Smith" },
    { time: "10:30 AM - 11:30 AM", subject: "Chemistry", room: "Lab 3", professor: "Dr. Clara Lee" },
    { time: "11:45 AM - 12:45 PM", subject: "English Literature", room: "Room 105", professor: "Ms. Diana Patel" },
    { time: "01:30 PM - 02:30 PM", subject: "Computer Science", room: "Room 303", professor: "Prof. Ethan Brown" },
  ],
  Tuesday: [
    { time: "08:00 AM - 09:00 AM", subject: "Biology", room: "Lab 1", professor: "Dr. Fiona Green" },
    { time: "09:15 AM - 10:15 AM", subject: "History", room: "Room 104", professor: "Prof. George White" },
    { time: "10:30 AM - 11:30 AM", subject: "Mathematics", room: "Room 101", professor: "Dr. Alice Johnson" },
    { time: "11:45 AM - 12:45 PM", subject: "Physics", room: "Room 202", professor: "Prof. Bob Smith" },
    { time: "01:30 PM - 02:30 PM", subject: "Art", room: "Studio 5", professor: "Ms. Hannah Lee" },
  ],
  Wednesday: [
    { time: "08:00 AM - 09:00 AM", subject: "Chemistry", room: "Lab 3", professor: "Dr. Clara Lee" },
    { time: "09:15 AM - 10:15 AM", subject: "Computer Science", room: "Room 303", professor: "Prof. Ethan Brown" },
    { time: "10:30 AM - 11:30 AM", subject: "English Literature", room: "Room 105", professor: "Ms. Diana Patel" },
    { time: "11:45 AM - 12:45 PM", subject: "Mathematics", room: "Room 101", professor: "Dr. Alice Johnson" },
    { time: "01:30 PM - 02:30 PM", subject: "Physics", room: "Room 202", professor: "Prof. Bob Smith" },
  ],
  Thursday: [
    { time: "08:00 AM - 09:00 AM", subject: "Physics", room: "Room 202", professor: "Prof. Bob Smith" },
    { time: "09:15 AM - 10:15 AM", subject: "Biology", room: "Lab 1", professor: "Dr. Fiona Green" },
    { time: "10:30 AM - 11:30 AM", subject: "History", room: "Room 104", professor: "Prof. George White" },
    { time: "11:45 AM - 12:45 PM", subject: "Computer Science", room: "Room 303", professor: "Prof. Ethan Brown" },
    { time: "01:30 PM - 02:30 PM", subject: "English Literature", room: "Room 105", professor: "Ms. Diana Patel" },
  ],
  Friday: [
    { time: "08:00 AM - 09:00 AM", subject: "Mathematics", room: "Room 101", professor: "Dr. Alice Johnson" },
    { time: "09:15 AM - 10:15 AM", subject: "Chemistry", room: "Lab 3", professor: "Dr. Clara Lee" },
    { time: "10:30 AM - 11:30 AM", subject: "Art", room: "Studio 5", professor: "Ms. Hannah Lee" },
    { time: "11:45 AM - 12:45 PM", subject: "History", room: "Room 104", professor: "Prof. George White" },
    { time: "01:30 PM - 02:30 PM", subject: "Biology", room: "Lab 1", professor: "Dr. Fiona Green" },
  ],
};

export default function DailyTimetable() {
  const [activeDay, setActiveDay] = useState("Monday");
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
          <main className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center">
            <h1
              className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              Weekly Timetable
            </h1>

            <Card className="w-full max-w-4xl shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl text-primary">Class Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="Monday" onValueChange={setActiveDay}>
                  <TabsList className="grid w-full grid-cols-5 mb-4">
                    {Object.keys(timetableData).map((day) => (
                      <TabsTrigger
                        key={day}
                        value={day}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {day}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {Object.entries(timetableData).map(([day, schedule]) => (
                    <TabsContent key={day} value={day}>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/4 text-primary">Time</TableHead>
                            <TableHead className="w-1/4 text-primary">Subject</TableHead>
                            <TableHead className="w-1/4 text-primary">Room</TableHead>
                            <TableHead className="w-1/4 text-primary">Professor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schedule.map(({ time, subject, room, professor }, idx) => (
                            <TableRow
                              key={idx}
                              className="hover:bg-muted transition-colors"
                            >
                              <TableCell className="font-medium">{time}</TableCell>
                              <TableCell>{subject}</TableCell>
                              <TableCell>{room}</TableCell>
                              <TableCell>{professor}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </main>
    </>
  );
}