import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sectionSlug = request.nextUrl.searchParams.get("section");

  const where = sectionSlug
    ? { links: { some: { section: { slug: sectionSlug } } } }
    : {};

  const items = await prisma.researchItem.findMany({
    where,
    include: {
      links: { include: { section: { select: { slug: true, title: true } } } },
      _count: { select: { comments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const item = await prisma.researchItem.create({
    data: {
      title: body.title,
      authors: body.authors ?? "",
      year: body.year ? parseInt(body.year, 10) : null,
      url: body.url ?? null,
      doi: body.doi ?? null,
      abstract: body.abstract ?? "",
      keywords: body.keywords ?? "",
      notes: body.notes ?? "",
      source: body.source ?? "manual",
    },
  });

  return NextResponse.json(item, { status: 201 });
}
