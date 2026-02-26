import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionEditor } from "./section-editor";
import { type SectionStatus } from "@/lib/constants";

interface SectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SectionPage({ params }: SectionPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const { slug } = await params;

  const section = await prisma.section.findUnique({
    where: { slug },
    include: {
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      researchLinks: {
        include: {
          researchItem: {
            select: { id: true, title: true, authors: true, year: true },
          },
        },
      },
    },
  });

  if (!section) {
    notFound();
  }

  return (
    <SectionEditor
      section={{
        ...section,
        status: section.status as SectionStatus,
      }}
      currentUserId={session.user.id}
    />
  );
}
