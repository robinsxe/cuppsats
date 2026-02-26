import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, Library, PenLine, PartyPopper } from "lucide-react";
import {
  STATUS_LABELS,
  STATUS_BADGE_VARIANTS,
  STATUS_CARD_VARIANTS,
  type SectionStatus,
} from "@/lib/constants";

export default async function DashboardPage() {
  const [sections, totalResearch] = await Promise.all([
    prisma.section.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { comments: true, researchLinks: true } },
      },
    }),
    prisma.researchItem.count(),
  ]);

  const nextSection =
    sections.find((s) => s.status === "in_progress") ??
    sections.find((s) => s.status === "not_started");

  const allDone = sections.length > 0 && sections.every((s) => s.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Uppsatsöversikt</h1>
          <p className="text-muted-foreground">
            Klicka på en sektion för att börja skriva
          </p>
        </div>
        <Link
          href="/research"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <Library className="h-4 w-4" />
          {totalResearch} {totalResearch === 1 ? "källa" : "källor"} i biblioteket
        </Link>
      </div>

      {allDone ? (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CardContent className="flex items-center gap-3 py-4">
            <PartyPopper className="h-5 w-5 text-green-600" />
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Alla sektioner är klara — snyggt jobbat!
            </p>
          </CardContent>
        </Card>
      ) : nextSection ? (
        <Link href={`/section/${nextSection.slug}`} className="block">
          <Card className="border-primary/30 bg-primary/5 transition-shadow hover:shadow-md">
            <CardContent className="flex items-start gap-4 py-4">
              <div className="rounded-full bg-primary/10 p-2">
                <PenLine className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Fortsätt skriva</p>
                <p className="text-base font-medium mt-0.5">
                  {nextSection.sortOrder}. {nextSection.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Senast uppdaterad:{" "}
                  {new Date(nextSection.updatedAt).toLocaleDateString("sv-SE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {nextSection.content && (() => {
                  const text = nextSection.content.replace(/<[^>]*>/g, "");
                  if (!text) return null;
                  return (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {text.slice(0, 80)}{text.length > 80 ? "…" : ""}
                    </p>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </Link>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const status = section.status as SectionStatus;
          return (
            <Link
              key={section.id}
              href={`/section/${section.slug}`}
              className="block"
            >
              <Card className={`transition-shadow hover:shadow-md h-full ${STATUS_CARD_VARIANTS[status]}`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-semibold">
                    {section.sortOrder}. {section.title}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={STATUS_BADGE_VARIANTS[status]}
                  >
                    {STATUS_LABELS[status]}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    Senast uppdaterad:{" "}
                    {new Date(section.updatedAt).toLocaleDateString("sv-SE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  {section.content && (() => {
                    const text = section.content.replace(/<[^>]*>/g, "");
                    return (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {text.slice(0, 120)}
                        {text.length > 120 ? "..." : ""}
                      </p>
                    );
                  })()}
                  <div className="flex gap-3 pt-1">
                    {section._count.researchLinks > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" />
                        {section._count.researchLinks}
                      </span>
                    )}
                    {section._count.comments > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {section._count.comments}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
