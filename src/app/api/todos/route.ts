import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todos = await prisma.todoItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const title = (body.title as string)?.trim();

  if (!title || title.length > 500) {
    return NextResponse.json(
      { error: "Titel krävs (max 500 tecken)" },
      { status: 400 }
    );
  }

  const assigneeId = body.assigneeId as string;
  if (!assigneeId) {
    return NextResponse.json(
      { error: "Tilldelad person krävs" },
      { status: 400 }
    );
  }

  // Validate assignee exists
  const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!assignee) {
    return NextResponse.json({ error: "Användaren finns inte" }, { status: 400 });
  }

  // Get max sortOrder
  const last = await prisma.todoItem.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const todo = await prisma.todoItem.create({
    data: {
      title,
      assigneeId,
      createdById: session.user.id,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(todo, { status: 201 });
}
