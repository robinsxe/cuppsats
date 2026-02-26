import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchSemanticScholar } from "@/lib/ai/semantic-scholar";
import { searchSwepub } from "@/lib/ai/swepub";
import { type SearchResult } from "@/lib/ai/types";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");
  const source = request.nextUrl.searchParams.get("source") ?? "all";

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  const results: SearchResult[] = [];

  const searches: Promise<void>[] = [];

  if (source === "all" || source === "semantic_scholar") {
    searches.push(
      searchSemanticScholar(query, 50).then((papers) => {
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
    );
  }

  if (source === "all" || source === "swepub") {
    searches.push(
      searchSwepub(query, 20).then((records) => {
        for (const record of records) {
          results.push({
            id: record.id,
            title: record.title,
            authors: record.authors.join(", "),
            year: record.year,
            abstract: record.abstract,
            url: record.url,
            doi: record.doi,
            source: "swepub",
          });
        }
      })
    );
  }

  await Promise.allSettled(searches);

  // Sort by year descending, nulls last
  results.sort((a, b) => {
    if (a.year === null && b.year === null) return 0;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    return b.year - a.year;
  });

  return NextResponse.json({ results, total: results.length });
}
