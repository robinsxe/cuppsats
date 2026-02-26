import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId, researchItemId } = await request.json();

  if (!sectionId || !researchItemId) {
    return NextResponse.json({ error: "Missing sectionId or researchItemId" }, { status: 400 });
  }

  const link = await prisma.researchLink.upsert({
    where: {
      sectionId_researchItemId: { sectionId, researchItemId },
    },
    update: {},
    create: { sectionId, researchItemId },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId, researchItemId } = await request.json();

  if (!sectionId || !researchItemId) {
    return NextResponse.json({ error: "Missing sectionId or researchItemId" }, { status: 400 });
  }

  await prisma.researchLink.deleteMany({
    where: { sectionId, researchItemId },
  });

  return NextResponse.json({ ok: true });
}
