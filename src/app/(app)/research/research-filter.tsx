"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ResearchFilterProps {
  sections: { slug: string; title: string }[];
  currentSection?: string;
}

export function ResearchFilter({ sections, currentSection }: ResearchFilterProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <label className="text-sm font-medium">Filtrera per sektion:</label>
      <Select
        value={currentSection ?? "all"}
        onValueChange={(value) => {
          if (value === "all") {
            router.push("/research");
          } else {
            router.push(`/research?section=${value}`);
          }
        }}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue placeholder="Alla sektioner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Alla sektioner</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.slug} value={s.slug}>
              {s.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
