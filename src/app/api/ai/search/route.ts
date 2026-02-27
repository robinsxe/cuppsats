import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { searchSemanticScholar } from "@/lib/ai/semantic-scholar";
import { searchOpenAlex } from "@/lib/ai/openalex";
import { type SearchResult } from "@/lib/ai/types";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`search:${session.user.id}`, 20);
  if (!rl.success) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen om en stund." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const query = request.nextUrl.searchParams.get("q");
  const source = request.nextUrl.searchParams.get("source") ?? "all";

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const results: SearchResult[] = [];
  const errors: string[] = [];

  const searches: Promise<void>[] = [];

  if (source === "all" || source === "semantic_scholar") {
    searches.push(
      searchSemanticScholar(query, 20)
        .then((papers) => {
          for (const paper of papers) {
            results.push({
              id: paper.paperId,
              title: paper.title,
              authors: paper.authors.map((a) => a.name).join(", "),
              year: paper.year,
              abstract: paper.abstract ?? "",
              url: paper.url,
              doi: paper.externalIds?.DOI ?? null,
              source: "semantic_scholar",
            });
          }
        })
        .catch((err) => {
          console.error("Semantic Scholar search failed:", err);
          errors.push("Semantic Scholar");
        })
    );
  }

  if (source === "all" || source === "openalex") {
    searches.push(
      searchOpenAlex(query, 20)
        .then((papers) => {
          for (const paper of papers) {
            results.push({
              id: paper.id,
              title: paper.title,
              authors: paper.authors.join(", "),
              year: paper.year,
              abstract: paper.abstract,
              url: paper.url,
              doi: paper.doi,
              source: "openalex",
            });
          }
        })
        .catch((err) => {
          console.error("OpenAlex search failed:", err);
          errors.push("OpenAlex");
        })
    );
  }

  await Promise.all(searches);

  // Deduplicate by DOI
  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    if (r.doi) {
      if (seen.has(r.doi)) return false;
      seen.add(r.doi);
    }
    return true;
  });

  // Sort by year descending, nulls last
  deduped.sort((a, b) => {
    if (a.year === null && b.year === null) return 0;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    return b.year - a.year;
  });

  return NextResponse.json({
    results: deduped,
    total: deduped.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}
