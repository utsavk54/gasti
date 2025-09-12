"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/utils/supabase/server";

export default function JoinGastiForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gastiId, setGastiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check if the Gasti room exists
      const { data: roomData, error: roomError } = await supabase
        .from("Gasti")
        .select("*")
        .eq("id", gastiId)
        .single();

      if (roomError || !roomData) {
        setError("Room does not exist");
        return;
      }

      // Add member to GastiMembers table
      const { error: memberError } = await supabase.from("GastiMembers").insert([
        {
          gasti_id: gastiId,
          first_name: firstName,
          last_name: lastName,
        },
      ]);

      if (memberError) {
        setError("Failed to join the Gasti");
        console.log(memberError);
        return;
      }

      // Redirect to the Gasti room
      router.push(`/gasti/${gastiId}`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-muted flex min-h-screen flex-col items-center justify-center p-6 md:p-50">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Join a Gasti Team</CardTitle>
          <CardDescription>Enter your details and the Gasti ID below.</CardDescription>
          <CardAction>
            <a href="#">Create Gasti</a>
          </CardAction>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <Input
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <Input
              placeholder="Gasti ID"
              maxLength={9}
              value={gastiId}
              onChange={(e) => setGastiId(e.target.value)}
            />

            {error && <p className="text-red-500">{error}</p>}

            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Joining..." : "Join Gasti"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
