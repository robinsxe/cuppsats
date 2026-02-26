export interface SwepubRecord {
  id: string;
  title: string;
  abstract: string;
  year: number | null;
  authors: string[];
  doi: string | null;
  url: string | null;
}

interface XsearchResponse {
  records?: {
    record?: {
      identifier?: string;
      metadata?: {
        title?: string;
        abstract?: string;
        date?: string;
        creator?: string[];
        identifier?: { type?: string; value?: string }[];
      };
    }[];
  };
}

export async function searchSwepub(
  query: string,
  limit = 10
): Promise<SwepubRecord[]> {
  const params = new URLSearchParams({
    query,
    n: String(limit),
    format: "json",
  });

  const response = await fetch(
    `https://xsearch.libris.kb.se/api/swepub?${params}`,
    { next: { revalidate: 300 } }
  );

  if (!response.ok) {
    console.error("SWEPUB error:", response.status, await response.text());
    return [];
  }

  const data: XsearchResponse = await response.json();
  const records = data.records?.record ?? [];

  return records.map((r) => {
    const meta = r.metadata ?? {};
    const identifiers = meta.identifier ?? [];
    const doiEntry = identifiers.find((i) => i.type === "doi");
    const urlEntry = identifiers.find((i) => i.type === "uri" || i.type === "url");

    return {
      id: r.identifier ?? "",
      title: meta.title ?? "Utan titel",
      abstract: meta.abstract ?? "",
      year: meta.date ? parseInt(meta.date, 10) || null : null,
      authors: meta.creator ?? [],
      doi: doiEntry?.value ?? null,
      url: urlEntry?.value ?? null,
    };
  });
}
