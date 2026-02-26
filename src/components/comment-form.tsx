"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  sectionId?: string;
  researchItemId?: string;
}

export function CommentForm({ sectionId, researchItemId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content.trim(),
        sectionId: sectionId ?? null,
        researchItemId: researchItemId ?? null,
      }),
    });

    setSending(false);

    if (response.ok) {
      setContent("");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Skriv en kommentar..."
        className="min-h-[80px]"
      />
      <Button
        type="submit"
        size="sm"
        disabled={sending || !content.trim()}
        className="gap-1.5"
      >
        <Send className="h-4 w-4" />
        {sending ? "Skickar..." : "Skicka"}
      </Button>
    </form>
  );
}
