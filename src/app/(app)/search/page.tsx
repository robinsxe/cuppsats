"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SearchResult } from "@/lib/ai/types";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setSearched(false);

    const params = new URLSearchParams({ q: query, source });
    const response = await fetch(`/api/ai/search?${params}`);

    setSearching(false);
    setSearched(true);

    if (response.ok) {
      const data = await response.json();
      setResults(data.results);
    }
  }

  async function handleImport(result: SearchResult) {
    setImportingId(result.id);

    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: result.title,
        authors: result.authors,
        year: result.year,
        url: result.url,
        doi: result.doi,
        abstract: result.abstract,
        source: result.source,
      }),
    });

    setImportingId(null);

    if (response.ok) {
      setImportedIds((prev) => new Set(prev).add(result.id));
    }
  }

  async function handleSummarize(result: SearchResult) {

    setSummarizingId(result.id);

    const response = await fetch("/api/ai/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: result.title,
        abstract: result.abstract,
      }),
    });

    setSummarizingId(null);

    if (response.ok) {
      const data = await response.json();
      setSummaries((prev) => ({ ...prev, [result.id]: data.summary }));
    } else {
      const data = await response.json();
      setSummaries((prev) => ({
        ...prev,
        [result.id]: data.error ?? "Kunde inte sammanfatta",
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sök artiklar</h1>
        <p className="text-muted-foreground">
          Sök i Semantic Scholar och OpenAlex
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sökord, t.ex. 'socialt arbete ADHD'..."
          className="h-11 text-base flex-1"
          autoFocus
        />
        <div className="flex gap-3">
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alla källor</SelectItem>
              <SelectItem value="semantic_scholar">Semantic Scholar</SelectItem>
              <SelectItem value="openalex">OpenAlex</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={searching} className="gap-2 h-11 shrink-0">
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Sök
          </Button>
        </div>
      </form>

      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Söker...</span>
        </div>
      )}

      {searched && !searching && results.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Inga resultat hittades. Prova andra sökord.
            </p>
          </CardContent>
        </Card>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {results.length} resultat
          </p>
          {results.map((result) => (
            <Card key={`${result.source}-${result.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-base font-semibold leading-snug">
                    {result.title}
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {result.source === "semantic_scholar"
                      ? "Semantic Scholar"
                      : "OpenAlex"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {result.authors && <span>{result.authors}</span>}
                  {result.authors && result.year && <span>·</span>}
                  {result.year && <span>{result.year}</span>}
                </div>

                {result.abstract && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {result.abstract}
                  </p>
                )}

                {summaries[result.id] && (
                  <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">
                      AI-sammanfattning
                    </p>
                    <p className="text-sm">{summaries[result.id]}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {importedIds.has(result.id) ? (
                    <Button size="sm" variant="outline" disabled>
                      Importerad
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => handleImport(result)}
                      disabled={importingId === result.id}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {importingId === result.id
                        ? "Importerar..."
                        : "Importera till bibliotek"}
                    </Button>
                  )}

                  {!summaries[result.id] && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => handleSummarize(result)}
                      disabled={summarizingId === result.id}
                    >
                      {summarizingId === result.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Sammanfatta
                    </Button>
                  )}

                  {result.url && (
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="ghost" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Öppna
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
