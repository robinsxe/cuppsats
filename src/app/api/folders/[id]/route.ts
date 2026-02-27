import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  const name = (body.name as string)?.trim();

  if (!name || name.length > 200) {
    return NextResponse.json(
      { error: "Mappnamn krävs (max 200 tecken)" },
      { status: 400 }
    );
  }

  const folder = await prisma.researchFolder.update({
    where: { id },
    data: { name },
    include: {
      _count: { select: { files: true } },
    },
  });

  return NextResponse.json(folder);
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

  // Move files to root (folderId = null) before deleting folder
  await prisma.researchFile.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });

  await prisma.researchFolder.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
