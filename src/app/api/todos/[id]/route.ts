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
  const data: Record<string, unknown> = {};

  if (typeof body.title === "string") {
    const title = body.title.trim();
    if (!title || title.length > 500) {
      return NextResponse.json(
        { error: "Titel krävs (max 500 tecken)" },
        { status: 400 }
      );
    }
    data.title = title;
  }

  if (typeof body.completed === "boolean") {
    data.completed = body.completed;
  }

  if (typeof body.assigneeId === "string") {
    const assignee = await prisma.user.findUnique({
      where: { id: body.assigneeId },
    });
    if (!assignee) {
      return NextResponse.json({ error: "Användaren finns inte" }, { status: 400 });
    }
    data.assigneeId = body.assigneeId;
  }

  const todo = await prisma.todoItem.update({
    where: { id },
    data,
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      createdBy: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json(todo);
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

  await prisma.todoItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
