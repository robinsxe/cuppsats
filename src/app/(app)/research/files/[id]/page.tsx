import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FileDetail } from "./file-detail";

interface FileDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FileDetailPage({ params }: FileDetailPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const [file, folders] = await Promise.all([
    prisma.researchFile.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true, role: true } },
        folder: { select: { id: true, name: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: "asc" },
          include: {
            author: { select: { id: true, name: true, role: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, role: true } },
              },
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    }),
    prisma.researchFolder.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!file) notFound();

  return (
    <FileDetail
      file={JSON.parse(JSON.stringify(file))}
      folders={folders}
      currentUserId={session!.user.id}
    />
  );
}
