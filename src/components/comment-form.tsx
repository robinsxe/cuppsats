"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  sectionId?: string;
  researchItemId?: string;
  parentId?: string;
  quotedText?: string;
  onCancel?: () => void;
}

export function CommentForm({
  sectionId,
  researchItemId,
  parentId,
  quotedText,
  onCancel,
}: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when entering reply mode
  useEffect(() => {
    if (parentId && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [parentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSending(true);

    const body: Record<string, string | null> = {
      content: content.trim(),
      sectionId: sectionId ?? null,
      researchItemId: researchItemId ?? null,
    };

    if (parentId) {
      body.parentId = parentId;
    }

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSending(false);

    if (response.ok) {
      setContent("");
      onCancel?.();
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {parentId && quotedText && (
        <div className="flex items-start gap-2 rounded-md border-l-4 border-muted-foreground/30 bg-muted/50 p-3">
          <blockquote className="flex-1 text-sm text-muted-foreground italic line-clamp-3">
            {quotedText}
          </blockquote>
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={onCancel}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Skriv ett svar..." : "Skriv en kommentar..."}
        className="min-h-[80px]"
      />
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={sending || !content.trim()}
          className="gap-1.5"
        >
          <Send className="h-4 w-4" />
          {sending ? "Skickar..." : parentId ? "Svara" : "Skicka"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Avbryt
          </Button>
        )}
      </div>
    </form>
  );
}
