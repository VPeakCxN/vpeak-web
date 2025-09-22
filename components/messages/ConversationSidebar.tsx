// File: components/messages/ConversationSidebar.tsx

"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming Shadcn Avatar is installed
import { toast } from "sonner";
import { useCookies } from "@/hooks/getCookies";

type Conversation = {
  conversation_id: string;
  title: string;
  avatar: string | null;
};

export function ConversationSidebar({
  onSelectConversation,
  selectedConversation,
}: {
  onSelectConversation: (id: string) => void;
  selectedConversation: string | null;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { currentUserId } = useCookies();

  const fetchConversations = async () => {
    try {
      const response = await fetch(`/api/messages/conversations?userId=${currentUserId}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      toast.error(`Error fetching conversations: ${(error as Error).message}`);
    }
  };

  useEffect(() => {
    if (currentUserId) fetchConversations();
  }, [currentUserId]);

  return (
    <Card className="col-span-1">
      <CardContent>
        <h2 className="font-bold mb-2">Conversations</h2>
        <ScrollArea className="h-[70vh]">
          {conversations.map((conv) => (
            <Button
              key={conv.conversation_id}
              variant={conv.conversation_id === selectedConversation ? "default" : "outline"}
              className="w-full mb-2 flex items-center gap-2"
              onClick={() => onSelectConversation(conv.conversation_id)}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={conv.avatar || ""} />
                <AvatarFallback>{conv.title[0]}</AvatarFallback>
              </Avatar>
              {conv.title}
            </Button>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
