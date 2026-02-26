import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const item = await prisma.researchItem.findUnique({
    where: { id },
    include: {
      links: { include: { section: { select: { id: true, slug: true, title: true } } } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
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

  const updateData: Record<string, unknown> = {};

  if (typeof body.title === "string") updateData.title = body.title;
  if (typeof body.authors === "string") updateData.authors = body.authors;
  if (body.year !== undefined) updateData.year = body.year ? parseInt(body.year, 10) : null;
  if (typeof body.url === "string") updateData.url = body.url || null;
  if (typeof body.doi === "string") updateData.doi = body.doi || null;
  if (typeof body.abstract === "string") updateData.abstract = body.abstract;
  if (typeof body.keywords === "string") updateData.keywords = body.keywords;
  if (typeof body.notes === "string") updateData.notes = body.notes;
  if (typeof body.summary === "string") updateData.summary = body.summary;

  const item = await prisma.researchItem.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(item);
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

  await prisma.researchItem.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
