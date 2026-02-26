export interface SearchResult {
  id: string;
  title: string;
  authors: string;
  year: number | null;
  abstract: string;
  url: string | null;
  doi: string | null;
  source: "semantic_scholar" | "swepub";
}
