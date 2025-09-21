"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Edit,
  Trash,
} from "lucide-react";
import { format } from "date-fns";


interface Event {
  uid: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  description: string | null;
  rules: string | null;
  venue: string | null;
  poster: string | null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_time: "",
    end_time: "",
    description: "",
    rules: "",
    venue: "",
    poster: "",
  });

  // Mock data fetching (replace with actual API call)
  useEffect(() => {
    const mockEvents: Event[] = [
      {
        uid: "123e4567-e89b-12d3-a456-426614174000",
        start_time: "2025-10-01T10:00:00Z",
        end_time: "2025-10-01T12:00:00Z",
        created_at: "2025-09-01T08:00:00Z",
        updated_at: "2025-09-01T08:00:00Z",
        description: "Annual Tech Conference",
        rules: "No outside food allowed",
        venue: "Convention Center",
        poster: "https://img.pikbest.com/templates/20241127/green-blue-backdrop-city-technology-business-theme-meeting-poster-2025-_11138589.jpg!sw800",
      },
      {
        uid: "223e4567-e89b-12d3-a456-426614174111",
        start_time: "2025-10-05T15:00:00Z",
        end_time: "2025-10-05T18:00:00Z",
        created_at: "2025-09-03T09:00:00Z",
        updated_at: "2025-09-03T09:00:00Z",
        description: "Intercollege Coding Hackathon",
        rules: "Teams of up to 4. Bring your laptops.",
        venue: "Library Hall",
        poster: "https://picsum.photos/seed/hackathon/600/400",
      },
      {
        uid: "323e4567-e89b-12d3-a456-426614174222",
        start_time: "2025-10-10T09:30:00Z",
        end_time: "2025-10-10T11:30:00Z",
        created_at: "2025-09-05T10:00:00Z",
        updated_at: "2025-09-05T10:00:00Z",
        description: "Art & Culture Exhibition",
        rules: "Open to all. Respect displayed works.",
        venue: "Auditorium",
        poster: "https://picsum.photos/seed/art/600/400",
      },
      {
        uid: "423e4567-e89b-12d3-a456-426614174333",
        start_time: "2025-10-15T19:00:00Z",
        end_time: "2025-10-15T22:00:00Z",
        created_at: "2025-09-06T14:00:00Z",
        updated_at: "2025-09-06T14:00:00Z",
        description: "Music Night – Battle of Bands",
        rules: "No outside instruments allowed. ID required.",
        venue: "Open Air Theatre",
        poster: "https://picsum.photos/seed/music/600/400",
      },
    ];
    setEvents(mockEvents);
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add API call to save event here
    console.log("Form submitted:", formData);
    setIsDialogOpen(false);
    setFormData({
      start_time: "",
      end_time: "",
      description: "",
      rules: "",
      venue: "",
      poster: "",
    });
  };

  const handleDelete = (uid: string) => {
    // Add API call to delete event here
    setEvents((prev) => prev.filter((event) => event.uid !== uid));
  };

  return (
        <main className="flex-1 container mx-auto p-6 space-y-6">
          {/* Page header and Add Event dialog */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Events</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      Start Time
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="datetime-local"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">End Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="datetime-local"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Description</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter event description"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Rules</label>
                    <Textarea
                      name="rules"
                      value={formData.rules}
                      onChange={handleInputChange}
                      placeholder="Enter event rules"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Venue</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="venue"
                        value={formData.venue}
                        onChange={handleInputChange}
                        placeholder="Enter venue"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Poster URL</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        name="poster"
                        value={formData.poster}
                        onChange={handleInputChange}
                        placeholder="Enter poster URL"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Save Event
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Events grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.uid} className="border border-border bg-card">
                {/* Poster */}
                {event.poster && (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-md">
                    <Image
                      src={event.poster}
                      alt={`${event.description ?? "Event"} poster`}
                      fill
                      className="object-cover"
                      sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                    />
                  </div>
                )}

                {/* Header */}
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base text-card-foreground">
                      {event.description ?? "Untitled event"}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-accent text-accent hover:bg-accent/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(event.uid)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Time chips */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      <Calendar className="mr-1 h-3 w-3" />
                      {format(new Date(event.start_time), "PPP p")}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-secondary/10 px-2 py-1 text-xs font-medium text-secondary">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(event.end_time), "PPP p")}
                    </span>
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4 text-secondary" />
                    <span className="text-card-foreground">{event.venue || "TBA"}</span>
                  </div>
                  {event.rules && (
                    <div className="rounded-md bg-accent/10 p-2 text-xs text-accent">
                      {event.rules}
                    </div>
                  )}
                </CardContent>

                {/* Footer meta */}
                <CardFooter className="flex justify-between">
                  <span className="text-xs text-muted-foreground">
                    Created {format(new Date(event.created_at), "PPP")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Updated {format(new Date(event.updated_at), "PPP")}
                  </span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </main>
  );
}
