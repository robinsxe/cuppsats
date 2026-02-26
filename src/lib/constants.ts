export const SECTION_STATUSES = [
  "not_started",
  "in_progress",
  "draft",
  "review",
  "done",
] as const;

export type SectionStatus = (typeof SECTION_STATUSES)[number];

export const STATUS_LABELS: Record<SectionStatus, string> = {
  not_started: "Ej påbörjad",
  in_progress: "Pågående",
  draft: "Utkast",
  review: "Granskning",
  done: "Klar",
};

export const STATUS_COLORS: Record<SectionStatus, string> = {
  not_started: "bg-gray-300",
  in_progress: "bg-blue-500",
  draft: "bg-yellow-500",
  review: "bg-orange-500",
  done: "bg-green-500",
};

export const STATUS_CARD_VARIANTS: Record<SectionStatus, string> = {
  not_started: "",
  in_progress: "!bg-blue-50 !border-blue-200 dark:!bg-blue-950/30 dark:!border-blue-800",
  draft: "!bg-yellow-50 !border-yellow-200 dark:!bg-yellow-950/30 dark:!border-yellow-800",
  review: "!bg-orange-50 !border-orange-200 dark:!bg-orange-950/30 dark:!border-orange-800",
  done: "!bg-green-50 !border-green-200 dark:!bg-green-950/30 dark:!border-green-800",
};

export const STATUS_BADGE_VARIANTS: Record<SectionStatus, string> = {
  not_started: "bg-gray-100 text-gray-700 border-gray-300",
  in_progress: "bg-blue-100 text-blue-700 border-blue-300",
  draft: "bg-yellow-100 text-yellow-700 border-yellow-300",
  review: "bg-orange-100 text-orange-700 border-orange-300",
  done: "bg-green-100 text-green-700 border-green-300",
};

export const THESIS_SECTIONS = [
  { slug: "inledning", title: "Inledning", sortOrder: 1 },
  { slug: "bakgrund", title: "Bakgrund / Tidigare forskning", sortOrder: 2 },
  { slug: "teoretisk-referensram", title: "Teoretisk referensram", sortOrder: 3 },
  { slug: "syfte-fragestallningar", title: "Syfte och frågeställningar", sortOrder: 4 },
  { slug: "metod", title: "Metod", sortOrder: 5 },
  { slug: "resultat", title: "Resultat", sortOrder: 6 },
  { slug: "analys", title: "Analys", sortOrder: 7 },
  { slug: "diskussion", title: "Diskussion", sortOrder: 8 },
  { slug: "slutsats", title: "Slutsats", sortOrder: 9 },
  { slug: "referenslista", title: "Referenslista", sortOrder: 10 },
] as const;

export const STATUS_WEIGHT: Record<SectionStatus, number> = {
  not_started: 0,
  in_progress: 0.25,
  draft: 0.5,
  review: 0.75,
  done: 1,
};
