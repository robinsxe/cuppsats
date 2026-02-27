import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  if (!body.sectionId && !body.researchItemId && !body.researchFileId) {
    return NextResponse.json(
      { error: "Either sectionId, researchItemId, or researchFileId is required" },
      { status: 400 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content: body.content.trim().slice(0, 5000),
      authorId: session.user.id,
      sectionId: body.sectionId ?? null,
      researchItemId: body.researchItemId ?? null,
      researchFileId: body.researchFileId ?? null,
      parentId: body.parentId ?? null,
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
