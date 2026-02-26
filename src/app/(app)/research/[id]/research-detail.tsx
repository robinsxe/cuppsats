"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Trash2,
  Link as LinkIcon,
  Unlink,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CommentList } from "@/components/comment-list";
import { CommentForm } from "@/components/comment-form";

interface ResearchDetailProps {
  item: {
    id: string;
    title: string;
    authors: string;
    year: number | null;
    url: string | null;
    doi: string | null;
    abstract: string;
    summary: string;
    keywords: string;
    notes: string;
    source: string;
    links: {
      id: string;
      sectionId: string;
      section: { id: string; slug: string; title: string };
    }[];
    comments: {
      id: string;
      content: string;
      createdAt: Date;
      author: { id: string; name: string; role: string };
    }[];
  };
  allSections: { id: string; slug: string; title: string }[];
  currentUserId: string;
}

export function ResearchDetail({ item, allSections, currentUserId }: ResearchDetailProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(item.notes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [linkingSection, setLinkingSection] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryText, setSummaryText] = useState(item.summary);
  const [summaryError, setSummaryError] = useState("");

  const linkedSectionIds = new Set(item.links.map((l) => l.sectionId));
  const unlinkedSections = allSections.filter((s) => !linkedSectionIds.has(s.id));

  async function handleSaveNotes() {
    setSaving(true);
    const res = await fetch(`/api/research/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleSummarize() {
    if (!item.abstract) return;
    setSummarizing(true);
    setSummaryError("");

    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        abstract: item.abstract,
        researchItemId: item.id,
      }),
    });

    setSummarizing(false);

    if (response.ok) {
      const data = await response.json();
      setSummaryText(data.summary);
    } else {
      const data = await response.json();
      setSummaryError(data.error ?? "Kunde inte sammanfatta");
    }
  }

  async function handleDelete() {
    if (!confirm("Radera denna källa?")) return;
    setDeleting(true);
    await fetch(`/api/research/${item.id}`, { method: "DELETE" });
    router.push("/research");
  }

  async function handleLinkSection() {
    if (!linkingSection) return;
    await fetch("/api/research-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId: linkingSection, researchItemId: item.id }),
    });
    setLinkingSection("");
    router.refresh();
  }

  async function handleUnlinkSection(sectionId: string) {
    await fetch("/api/research-links", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionId, researchItemId: item.id }),
    });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/research">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{item.title}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            {item.authors && <span>{item.authors}</span>}
            {item.authors && item.year && <span>·</span>}
            {item.year && <span>{item.year}</span>}
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="h-4 w-4" />
          Radera
        </Button>
      </div>

      {/* Metadata */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="capitalize">
          {item.source === "semantic_scholar"
            ? "Semantic Scholar"
            : item.source === "swepub"
              ? "SWEPUB"
              : "Manuell"}
        </Badge>
        {item.doi && <Badge variant="secondary">DOI: {item.doi}</Badge>}
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Öppna länk
          </a>
        )}
      </div>

      {/* Abstract */}
      {item.abstract && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Abstract</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{item.abstract}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Summary */}
      {summaryText ? (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI-sammanfattning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{summaryText}</p>
          </CardContent>
        </Card>
      ) : item.abstract ? (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleSummarize}
            disabled={summarizing}
          >
            {summarizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {summarizing ? "Sammanfattar..." : "Generera AI-sammanfattning"}
          </Button>
          {summaryError && (
            <p className="text-sm text-destructive">{summaryError}</p>
          )}
        </div>
      ) : null}

      {/* Keywords */}
      {item.keywords && (
        <div className="flex gap-1.5 flex-wrap">
          {item.keywords.split(",").map((kw) => (
            <Badge key={kw.trim()} variant="secondary" className="text-xs">
              {kw.trim()}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Section Links */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Länkade sektioner</h2>
        {item.links.length > 0 ? (
          <div className="flex gap-2 flex-wrap">
            {item.links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm"
              >
                <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <Link
                  href={`/section/${link.section.slug}`}
                  className="hover:underline"
                >
                  {link.section.title}
                </Link>
                <button
                  onClick={() => handleUnlinkSection(link.sectionId)}
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  title="Ta bort länk"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Inga länkade sektioner</p>
        )}

        {unlinkedSections.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={linkingSection} onValueChange={setLinkingSection}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Välj sektion att länka..." />
              </SelectTrigger>
              <SelectContent>
                {unlinkedSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleLinkSection} disabled={!linkingSection}>
              <LinkIcon className="h-4 w-4 mr-1" />
              Länka
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Notes */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Egna anteckningar</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Skriv dina anteckningar här..."
          className="min-h-[120px]"
        />
        <Button
          size="sm"
          onClick={handleSaveNotes}
          disabled={saving || notes === item.notes}
          className="gap-1.5"
        >
          <Save className="h-4 w-4" />
          {saving ? "Sparar..." : saved ? "Sparat!" : "Spara anteckningar"}
        </Button>
      </div>

      <Separator />

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Kommentarer</h2>
        <CommentList comments={item.comments} currentUserId={currentUserId} />
        <CommentForm researchItemId={item.id} />
      </div>
    </div>
  );
}
