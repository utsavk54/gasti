"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent } from "./ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { supabase } from "@/utils/supabase/server"; // make sure to use client instance
import { LiveKitRoom, ParticipantAudioTile } from "@livekit/components-react";

interface Member {
  id: number;
  first_name: string;
  last_name: string;
}

interface Message {
  id: number;
  user_name: string;
  content: string;
  created_at: string;
}

export default function GastiRoom({ gastiId }: { gastiId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [livekitToken, setLivekitToken] = useState<string | null>(null);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const { data, error } = await supabase
          .from("GastiMembers")
          .select("*")
          .eq("gasti_id", gastiId);

        if (error) throw error;
        if (data) setMembers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [gastiId]);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("message")
          .select("*")
          .eq("gasti_id", gastiId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (data) setMessages(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [gastiId]);

  // Fetch LiveKit token from your server API
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch(`/api/token?gastiId=${gastiId}`);
        const data = await res.json();
        setLivekitToken(data.token);
      } catch (err) {
        console.error("Failed to get LiveKit token", err);
      }
    };

    fetchToken();
  }, [gastiId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);

    try {
      const { error } = await supabase.from("message").insert([
        {
          gasti_id: gastiId,
          member_id: 3, // replace with actual user ID
          message_text: newMessage.trim(),
        },
      ]);

      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), user_name: "You", content: newMessage.trim(), created_at: new Date().toISOString() },
      ]);

      setNewMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <h2 className="text-xl font-bold">Gasti: {gastiId}</h2>
      </CardHeader>

      <CardContent className="grid gap-4 md:grid-cols-2">
        {/* Members sidebar */}
        <div className="hidden md:block border-r pr-4">
          <h3 className="font-semibold mb-2">Active Members</h3>
          {loadingMembers ? (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {members.map((member) => (
                <li key={member.id}>
                  {member.first_name} {member.last_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat + LiveKit audio */}
        <div className="flex flex-col">
          {/* Mobile members dropdown */}
          <div className="md:hidden mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <Users className="h-4 w-4 mr-2" />
                  Members
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {members.map((member) => (
                  <DropdownMenuItem key={member.id}>
                    {member.first_name} {member.last_name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* LiveKit Audio Room */}
          {livekitToken ? (
            <div className="mb-4 border rounded p-2">
              <h3 className="font-semibold mb-2">Live Audio Room</h3>
              <LiveKitRoom
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
                token={livekitToken}
                audio
                video={false}
              >
                <ParticipantAudioTile />
              </LiveKitRoom>
            </div>
          ) : (
            <p>Connecting to audio room...</p>
          )}

          {/* Chat messages */}
          <div className="flex-1 border rounded-lg p-3 overflow-y-auto min-h-[200px] flex flex-col gap-2 mb-3">
            {loadingMessages ? (
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="p-2 border rounded">
                  <p className="font-semibold text-sm">{msg.user_name}</p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Input box */}
          <div className="flex">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 border rounded-l-lg px-3 py-2 text-sm"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <Button
              className="rounded-l-none"
              onClick={handleSendMessage}
              disabled={sending}
            >
              {sending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
