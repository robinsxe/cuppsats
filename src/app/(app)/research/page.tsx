import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, MessageSquare, ExternalLink } from "lucide-react";
import { ResearchFilter } from "./research-filter";

interface ResearchPageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function ResearchPage({ searchParams }: ResearchPageProps) {
  const { section: sectionSlug } = await searchParams;

  const where = sectionSlug
    ? { links: { some: { section: { slug: sectionSlug } } } }
    : {};

  const [items, sections] = await Promise.all([
    prisma.researchItem.findMany({
      where,
      include: {
        links: {
          include: { section: { select: { slug: true, title: true } } },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.section.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Forskningsbibliotek</h1>
          <p className="text-muted-foreground">
            {items.length} {items.length === 1 ? "källa" : "källor"}
          </p>
        </div>
        <Link href="/research/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Lägg till källa
          </Button>
        </Link>
      </div>

      <ResearchFilter sections={sections} currentSection={sectionSlug} />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {sectionSlug
                ? "Inga källor länkade till denna sektion"
                : "Inga källor ännu. Lägg till din första källa!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Link key={item.id} href={`/research/${item.id}`} className="block">
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <CardTitle className="text-base font-semibold leading-snug">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.url && (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                      {item._count.comments > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {item._count.comments}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {item.authors && <span>{item.authors}</span>}
                    {item.authors && item.year && <span>·</span>}
                    {item.year && <span>{item.year}</span>}
                    {(item.authors || item.year) && <span>·</span>}
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.source === "semantic_scholar"
                        ? "Semantic Scholar"
                        : item.source === "swepub"
                          ? "SWEPUB"
                          : "Manuell"}
                    </Badge>
                  </div>
                  {item.links.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {item.links.map((link) => (
                        <Badge key={link.id} variant="secondary" className="text-xs">
                          {link.section.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
