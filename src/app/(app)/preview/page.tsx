import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ThesisPreview } from "./thesis-preview";

export default async function PreviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const sections = await prisma.section.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      researchLinks: {
        include: {
          researchItem: {
            select: {
              id: true,
              title: true,
              authors: true,
              year: true,
              url: true,
              doi: true,
            },
          },
        },
      },
    },
  });

  return <ThesisPreview sections={sections} />;
}
