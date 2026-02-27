import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";
import { sanitizeFileName } from "@/lib/file-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const file = await prisma.researchFile.findUnique({
    where: { id },
    include: {
      uploader: { select: { id: true, name: true, role: true } },
      folder: { select: { id: true, name: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, role: true } },
          replies: {
            include: {
              author: { select: { id: true, name: true, role: true } },
            },
          },
        },
        where: { parentId: null },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!file) {
    return NextResponse.json({ error: "Fil hittades inte" }, { status: 404 });
  }

  return NextResponse.json(file);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = sanitizeFileName(body.name.trim());
    if (!name) {
      return NextResponse.json({ error: "Namn krävs" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.folderId !== undefined) {
    if (body.folderId !== null) {
      const folder = await prisma.researchFolder.findUnique({
        where: { id: body.folderId },
      });
      if (!folder) {
        return NextResponse.json({ error: "Mappen finns inte" }, { status: 400 });
      }
    }
    data.folderId = body.folderId;
  }

  const file = await prisma.researchFile.update({
    where: { id },
    data,
    include: {
      uploader: { select: { id: true, name: true } },
      folder: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(file);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const file = await prisma.researchFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Fil hittades inte" }, { status: 404 });
  }

  // Delete from Vercel Blob
  try {
    await del(file.blobUrl);
  } catch {
    // Blob may already be deleted — continue
  }

  // Delete from DB (cascades comments)
  await prisma.researchFile.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
