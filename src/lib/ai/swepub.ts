export interface SwepubRecord {
  id: string;
  title: string;
  abstract: string;
  year: number | null;
  authors: string[];
  doi: string | null;
  url: string | null;
}

interface XsearchRecord {
  identifier?: string;
  title?: string;
  creator?: string[];
  description?: string[];
  type?: string;
  date?: string;
  isbn?: string;
  relation?: string;
}

interface XsearchResponse {
  xsearch?: {
    list?: XsearchRecord[];
    records?: number;
  };
}

export async function searchSwepub(
  query: string,
  limit = 20
): Promise<SwepubRecord[]> {
  const params = new URLSearchParams({
    query,
    database: "swepub",
    n: String(limit),
    format: "json",
  });

  const response = await fetch(
    `https://libris.kb.se/xsearch?${params}`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) {
    const text = await response.text();
    console.error("SWEPUB error:", response.status, text);
    throw new Error(`SWEPUB API returned ${response.status}`);
  }

  const data: XsearchResponse = await response.json();
  const records = data.xsearch?.list ?? [];

  return records.map((r) => {
    const description = r.description?.join(" ") ?? "";
    const yearMatch = r.date?.match(/\d{4}/);

    return {
      id: r.identifier ?? "",
      title: r.title ?? "Utan titel",
      abstract: description,
      year: yearMatch ? parseInt(yearMatch[0], 10) : null,
      authors: r.creator ?? [],
      doi: null,
      url: r.identifier?.startsWith("http") ? r.identifier : null,
    };
  });
}
