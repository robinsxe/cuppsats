"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/research", label: "Källor" },
  { href: "/research/files", label: "Filer" },
];

export function ResearchTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b pb-px mb-4">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/research"
            ? pathname === "/research"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-t-md transition-colors -mb-px",
              isActive
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
