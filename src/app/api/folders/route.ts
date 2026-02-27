import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await prisma.researchFolder.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { files: true } },
    },
  });

  return NextResponse.json(folders);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = (body.name as string)?.trim();

  if (!name || name.length > 200) {
    return NextResponse.json(
      { error: "Mappnamn krävs (max 200 tecken)" },
      { status: 400 }
    );
  }

  const last = await prisma.researchFolder.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const folder = await prisma.researchFolder.create({
    data: {
      name,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    include: {
      _count: { select: { files: true } },
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
