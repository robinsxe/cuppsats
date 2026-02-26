"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; name: string; role: string };
}

interface CommentListProps {
  comments: Comment[];
  currentUserId: string;
}

export function CommentList({ comments, currentUserId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Inga kommentarer ännu</p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const isOwn = comment.author.id === currentUserId;
        const initials = comment.author.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase();

        return (
          <div key={comment.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">
                {initials}
              </AvatarFallback>
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
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
