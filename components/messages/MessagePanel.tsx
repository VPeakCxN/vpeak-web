// File: components/messages/MessagePanel.tsx

"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

type Message = {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
};

export function MessagePanel({ conversationId }: { conversationId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");

  const fetchMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await fetch(`/api/messages/messages?conversationId=${conversationId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      toast.error(`Error fetching messages: ${(error as Error).message}`);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage, conversation_id: conversationId }),
      });
      if (!response.ok) throw new Error("Failed to send");
      setNewMessage("");
      fetchMessages(); // Refresh (though realtime will handle)
      toast.success("Message sent ✅");
    } catch (error) {
      toast.error(`Error sending message: ${(error as Error).message}`);
    }
  };

  // Realtime subscription for hot reload
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages:${conversationId}`)
      // @ts-ignore: Suppress type error for realtime subscription
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return (
    <Card className="col-span-2">
      <CardContent className="flex flex-col h-[80vh]">
        <ScrollArea className="flex-1 mb-4">
          {messages.length > 0 ? (
            messages.map((msg) => (
              <div key={msg.id} className="mb-2 p-2 rounded bg-muted">
                <p>{msg.content}</p>
                {msg.image_url && (
                  <img src={msg.image_url} alt="attachment" className="mt-2 max-h-40 rounded" />
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No messages yet.</p>
          )}
        </ScrollArea>
        {conversationId && (
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
