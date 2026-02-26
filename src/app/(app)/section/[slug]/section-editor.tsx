"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Cloud, Loader2, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichEditor } from "@/components/rich-editor";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SECTION_STATUSES,
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
  type SectionStatus,
} from "@/lib/constants";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";

export interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  parentId: string | null;
  author: { id: string; name: string; role: string };
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    parentId: string | null;
    author: { id: string; name: string; role: string };
  }[];
}

interface SectionData {
  id: string;
  slug: string;
  title: string;
  sortOrder: number;
  status: SectionStatus;
  content: string;
  comments: CommentData[];
  researchLinks: {
    id: string;
    researchItem: { id: string; title: string; authors: string; year: number | null };
  }[];
}

interface SectionEditorProps {
  section: SectionData;
  currentUserId: string;
}

type SaveStatus = "idle" | "unsaved" | "saving" | "saved";

export function SectionEditor({ section, currentUserId }: SectionEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(section.content);
  const [status, setStatus] = useState<SectionStatus>(section.status);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const isInitialRender = useRef(true);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasChanges =
    content !== section.content || status !== section.status;

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");

    const response = await fetch(`/api/sections/${section.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, status }),
    });

    if (response.ok) {
      setSaveStatus("saved");
      router.refresh();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("unsaved");
    }
  }, [content, status, section.slug, router]);

  // Autosave with 5s debounce
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (!hasChanges) return;

    setSaveStatus("unsaved");

    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }
    autosaveTimer.current = setTimeout(() => {
      handleSave();
    }, 5000);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [content, status, hasChanges, handleSave]);

  // Ctrl+S keyboard shortcut for immediate save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasChanges) {
          if (autosaveTimer.current) {
            clearTimeout(autosaveTimer.current);
          }
          handleSave();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasChanges, handleSave]);

  // Reply state
  const [replyTo, setReplyTo] = useState<{ parentId: string; quotedText: string } | null>(null);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">
            {section.sortOrder}. {section.title}
          </h1>
        </div>
        <Badge variant="outline" className={STATUS_BADGE_VARIANTS[status]}>
          {STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Status:</label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as SectionStatus)}
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SECTION_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="hidden sm:block flex-1" />

        {/* Save status indicator */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          {saveStatus === "unsaved" && (
            <Cloud className="h-4 w-4" />
          )}
          {saveStatus === "saving" && (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sparar...</span>
            </>
          )}
          {saveStatus === "saved" && (
            <>
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Sparat</span>
            </>
          )}
        </div>
      </div>

      <RichEditor
        value={content}
        onValueChange={setContent}
        placeholder="Börja skriva här..."
        minHeight={400}
      />

      {/* Linked Research */}
      {section.researchLinks.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Länkade källor ({section.researchLinks.length})
            </h2>
            <div className="space-y-2">
              {section.researchLinks.map((link) => (
                <Link
                  key={link.id}
                  href={`/research/${link.researchItem.id}`}
                  className="block rounded-md border p-3 text-sm hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{link.researchItem.title}</span>
                  {(link.researchItem.authors || link.researchItem.year) && (
                    <span className="text-muted-foreground ml-2">
                      {link.researchItem.authors}
                      {link.researchItem.authors && link.researchItem.year && " · "}
                      {link.researchItem.year}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          Kommentarer ({section.comments.length})
        </h2>
        <CommentList
          comments={section.comments}
          currentUserId={currentUserId}
          onReply={(parentId, quotedText) => setReplyTo({ parentId, quotedText })}
        />
        <CommentForm
          sectionId={section.id}
          parentId={replyTo?.parentId}
          quotedText={replyTo?.quotedText}
          onCancel={replyTo ? () => setReplyTo(null) : undefined}
        />
      </div>
    </div>
  );
}
