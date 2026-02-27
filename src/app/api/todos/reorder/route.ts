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
  const items = body.items as { id: string; sortOrder: number }[];

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Items array krävs" }, { status: 400 });
  }

  // Batch update sortOrder
  await Promise.all(
    items.map((item) =>
      prisma.todoItem.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      })
    )
  );

  return NextResponse.json({ success: true });
}
