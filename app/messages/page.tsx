"use client";
import { useState } from "react";
import { ConversationSidebar } from "@/components/messages/ConversationSidebar";
import { MessagePanel } from "@/components/messages/MessagePanel";

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      <ConversationSidebar
        onSelectConversation={setSelectedConversation}
        selectedConversation={selectedConversation}
      />
      <MessagePanel conversationId={selectedConversation} />
    </div>
  );
}