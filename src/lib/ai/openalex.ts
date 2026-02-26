export interface OpenAlexPaper {
  id: string;
  title: string;
  abstract: string;
  year: number | null;
  url: string | null;
  doi: string | null;
  authors: string[];
}

interface OpenAlexWork {
  id: string;
  doi: string | null;
  title: string;
  publication_year: number | null;
  authorships: { author: { display_name: string } }[];
  abstract_inverted_index: Record<string, number[]> | null;
  primary_location: {
    landing_page_url: string | null;
  } | null;
}

interface OpenAlexResponse {
  meta: { count: number };
  results: OpenAlexWork[];
}

function reconstructAbstract(
  invertedIndex: Record<string, number[]> | null
): string {
  if (!invertedIndex) return "";

  const words: [number, string][] = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) {
      words.push([pos, word]);
    }
  }
  words.sort((a, b) => a[0] - b[0]);
  return words.map(([, word]) => word).join(" ");
}

export async function searchOpenAlex(
  query: string,
  limit = 20
): Promise<OpenAlexPaper[]> {
  const params = new URLSearchParams({
    search: query,
    per_page: String(limit),
    select:
      "id,doi,title,publication_year,authorships,abstract_inverted_index,primary_location",
  });

  const response = await fetch(
    `https://api.openalex.org/works?${params}`,
    {
      headers: {
        "User-Agent": "c-uppsats-tool/1.0 (mailto:noreply@example.com)",
      },
      next: { revalidate: 300 },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAlex error:", response.status, text);
    throw new Error(`OpenAlex API returned ${response.status}`);
  }

  const data: OpenAlexResponse = await response.json();

  return data.results.map((work) => {
    const doi = work.doi?.replace("https://doi.org/", "") ?? null;

    return {
      id: work.id.replace("https://openalex.org/", ""),
      title: work.title,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      year: work.publication_year,
      url: work.primary_location?.landing_page_url ?? work.doi ?? null,
      doi,
      authors: work.authorships.map((a) => a.author.display_name),
    };
  });
}
