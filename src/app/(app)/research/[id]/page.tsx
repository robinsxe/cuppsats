import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ResearchDetail } from "./research-detail";

interface ResearchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResearchDetailPage({ params }: ResearchDetailPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const { id } = await params;

  const [item, allSections] = await Promise.all([
    prisma.researchItem.findUnique({
      where: { id },
      include: {
        links: {
          include: { section: { select: { id: true, slug: true, title: true } } },
        },
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.section.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, title: true },
    }),
  ]);

  if (!item) return notFound();

  return (
    <ResearchDetail
      item={item}
      allSections={allSections}
      currentUserId={session.user.id}
    />
  );
}
