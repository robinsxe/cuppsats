import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SECTION_STATUSES } from "@/lib/constants";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const body = await request.json();

  const updateData: { content?: string; status?: string; title?: string } = {};

  if (typeof body.content === "string") {
    if (body.content.length > 100_000) {
      return NextResponse.json(
        { error: "Innehållet är för långt (max 100 000 tecken)" },
        { status: 400 }
      );
    }
    updateData.content = body.content;
  }

  if (body.status && SECTION_STATUSES.includes(body.status)) {
    updateData.status = body.status;
  }

  if (typeof body.title === "string" && body.title.trim().length > 0) {
    updateData.title = body.title.trim();
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  }

  const section = await prisma.section.update({
    where: { slug },
    data: updateData,
  });

  return NextResponse.json(section);
}
