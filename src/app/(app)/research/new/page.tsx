"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewResearchPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);

    const response = await fetch("/api/research", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.get("title"),
        authors: formData.get("authors"),
        year: formData.get("year"),
        url: formData.get("url"),
        doi: formData.get("doi"),
        abstract: formData.get("abstract"),
        keywords: formData.get("keywords"),
        notes: formData.get("notes"),
      }),
    });

    setSaving(false);

    if (response.ok) {
      const item = await response.json();
      router.push(`/research/${item.id}`);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/research">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Lägg till källa</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titel *</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="Artikelns titel"
            className="h-11 text-base"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="authors">Författare</Label>
            <Input
              id="authors"
              name="authors"
              placeholder="Förnamn Efternamn, ..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">År</Label>
            <Input
              id="year"
              name="year"
              type="number"
              min="1900"
              max="2099"
              placeholder="2024"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doi">DOI</Label>
            <Input id="doi" name="doi" placeholder="10.1000/xyz123" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="abstract">Abstract</Label>
          <Textarea
            id="abstract"
            name="abstract"
            placeholder="Sammanfattning av artikeln..."
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">Nyckelord</Label>
          <Input
            id="keywords"
            name="keywords"
            placeholder="nyckelord1, nyckelord2, ..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Egna anteckningar</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Dina tankar om artikeln..."
            className="min-h-[80px]"
          />
        </div>

        <Button type="submit" disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Sparar..." : "Spara källa"}
        </Button>
      </form>
    </div>
  );
}
