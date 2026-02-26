export interface SemanticScholarPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  url: string;
  externalIds: { DOI?: string } | null;
  authors: { name: string }[];
}

interface SemanticScholarResponse {
  total: number;
  data: SemanticScholarPaper[];
}

export async function searchSemanticScholar(
  query: string,
  limit = 50
): Promise<SemanticScholarPaper[]> {
  const params = new URLSearchParams({
    query,
    limit: String(limit),
    fields: "title,abstract,year,url,externalIds,authors",
  });

  const response = await fetch(
    `https://api.semanticscholar.org/graph/v1/paper/search?${params}`,
    {
      headers: { "User-Agent": "c-uppsats-tool/1.0" },
      next: { revalidate: 300 }, // cache 5 min
    }
  );

  if (!response.ok) {
    console.error("Semantic Scholar error:", response.status, await response.text());
    return [];
  }

  const data: SemanticScholarResponse = await response.json();
  return data.data ?? [];
}
