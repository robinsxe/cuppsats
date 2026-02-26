"use client";

import { STATUS_COLORS, STATUS_LABELS, type SectionStatus } from "@/lib/constants";

interface ThesisProgressBarProps {
  sections: { slug: string; title: string; status: SectionStatus }[];
}

export function ThesisProgressBar({ sections }: ThesisProgressBarProps) {
  const total = sections.length;
  const doneCount = sections.filter((s) => s.status === "done").length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Framsteg</span>
        <span className="text-muted-foreground">
          {doneCount}/{total} klara ({percent}%)
        </span>
      </div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted gap-0.5">
        {sections.map((section) => (
          <div
            key={section.slug}
            className={`h-full flex-1 rounded-sm transition-colors ${STATUS_COLORS[section.status]}`}
            title={`${section.title}: ${STATUS_LABELS[section.status]}`}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap text-xs text-muted-foreground">
        {(["not_started", "in_progress", "draft", "review", "done"] as const).map(
          (status) => (
            <div key={status} className="flex items-center gap-1">
              <div className={`h-2.5 w-2.5 rounded-sm ${STATUS_COLORS[status]}`} />
              <span>{STATUS_LABELS[status]}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
