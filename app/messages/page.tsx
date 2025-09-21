// app/messages/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Send, Search, MoreVertical, User as UserIcon } from 'lucide-react';
import SiteHeader from "@/app/components/header";
import { SiteFooter } from "@/app/components/footer";
import { Sidebar } from "@/app/components/sidebar";
import { VerifiedUser } from "@/lib/auth/types";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

interface Message {
  id: string;
  sender: 'user' | 'self';
  content: string;
  time: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: 'Hey, how are you?',
    lastTime: '2m ago',
    unread: 2,
  },
  {
    id: '2',
    name: 'Bob Smith',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: 'Let\'s meet tomorrow',
    lastTime: '1h ago',
    unread: 0,
  },
  {
    id: '3',
    name: 'Charlie Brown',
    avatar: '/placeholder.svg?height=40&width=40',
    lastMessage: 'Thanks for the help!',
    lastTime: '3h ago',
    unread: 1,
  },
  // Add more mock conversations as needed
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    { id: '1', sender: 'user', content: 'Hello!', time: '10:00 AM' },
    { id: '2', sender: 'self', content: 'Hi Alice!', time: '10:01 AM' },
    { id: '3', sender: 'user', content: 'Hey, how are you?', time: '10:02 AM' },
  ],
  '2': [
    { id: '1', sender: 'user', content: 'Morning!', time: '9:00 AM' },
    { id: '2', sender: 'self', content: 'Good morning Bob!', time: '9:05 AM' },
  ],
  // Add more mock messages for other conversations
};

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [messages, setMessages] = useState<Message[]>(mockMessages[selectedConversation?.id || '1']);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      const newMsg: Message = {
        id: Date.now().toString(),
        sender: 'self',
        content: newMessage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    }
  };

  return (
    <>
      {error && <div>{error}</div>}
          <main className="flex-1">
            <div className="flex h-[calc(100vh-64px)] bg-background"> {/* Adjust height based on your navbar if any */}
              {/* Conversation List */}
              <div className="w-80 border-r border-border flex flex-col">
                <div className="p-4">
                  <h1 className="text-xl font-semibold mb-4">Messages</h1>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Separator />
                <ScrollArea className="flex-1">
                  {filteredConversations.map(conv => (
                    <div
                      key={conv.id}
                      className={`flex items-center p-4 cursor-pointer hover:bg-accent/50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setMessages(mockMessages[conv.id] || []);
                      }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.avatar} alt={conv.name} />
                        <AvatarFallback><UserIcon /></AvatarFallback>
                      </Avatar>
                      <div className="ml-3 flex-1">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-medium">{conv.name}</h3>
                          <span className="text-xs text-muted-foreground">{conv.lastTime}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      </div>
                      {conv.unread > 0 && (
                        <div className="ml-2 bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-1">
                          {conv.unread}
                        </div>
                      )}
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Chat Window */}
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border flex items-center justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                          <AvatarFallback><UserIcon /></AvatarFallback>
                        </Avatar>
                        <h2 className="ml-3 font-semibold">{selectedConversation.name}</h2>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={`mb-4 flex ${msg.sender === 'self' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              msg.sender === 'self'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            <p>{msg.content}</p>
                            <span className="text-xs opacity-70 mt-1 block text-right">{msg.time}</span>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t border-border flex items-center">
                      <Input
                        placeholder="Type a message..."
                        className="flex-1 mr-2"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted-foreground">
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          </main>
    </>
  );
}