"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Quote, Check, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ReplyData {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  author: { id: string; name: string; role: string };
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  author: { id: string; name: string; role: string };
  replies: ReplyData[];
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
  onReply: (parentId: string, quotedText: string) => void;
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  isReply,
}: {
  comment: Comment | ReplyData;
  currentUserId: string;
  onReply: (parentId: string, quotedText: string) => void;
  isReply?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwn = comment.author.id === currentUserId;
  const initials = comment.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  async function handleEditSave() {
    if (!editContent.trim()) return;
    setSaving(true);

    const response = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });

    setSaving(false);
    if (response.ok) {
      setEditing(false);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Vill du ta bort den här kommentaren?")) return;
    setDeleting(true);

    const response = await fetch(`/api/comments/${comment.id}`, {
      method: "DELETE",
    });

    setDeleting(false);
    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {comment.author.name}
            {isOwn && " (du)"}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {comment.author.role === "owner" ? "student" : "handledare"}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString("sv-SE", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-7 text-xs"
                onClick={handleEditSave}
                disabled={saving || !editContent.trim()}
              >
                <Check className="h-3 w-3" />
                Spara
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="gap-1 h-7 text-xs"
                onClick={() => {
                  setEditing(false);
                  setEditContent(comment.content);
                }}
              >
                <X className="h-3 w-3" />
                Avbryt
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
            <div className="flex items-center gap-1">
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 h-7 text-xs text-muted-foreground"
                  onClick={() => onReply(comment.id, comment.content)}
                >
                  <Quote className="h-3 w-3" />
                  Citera & svara
                </Button>
              )}
              {isOwn && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-7 text-xs text-muted-foreground"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-3 w-3" />
                    Redigera
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    <Trash2 className="h-3 w-3" />
                    Ta bort
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CommentList({ comments, currentUserId, onReply }: CommentListProps) {
  // Only show top-level comments (no parentId)
  const topLevel = comments.filter((c) => !c.parentId);

  if (topLevel.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Inga kommentarer ännu</p>
    );
  }

  return (
    <div className="space-y-4">
      {topLevel.map((comment) => (
        <div key={comment.id}>
          <CommentItem
            comment={comment}
            currentUserId={currentUserId}
            onReply={onReply}
          />
          {/* Nested replies */}
          {comment.replies.length > 0 && (
            <div className="ml-11 mt-3 space-y-3 border-l-2 border-muted pl-4">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  isReply
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
