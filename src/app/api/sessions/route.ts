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
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const wordCount = typeof body.wordCount === "number" ? body.wordCount : 0;
  const minutes = typeof body.minutes === "number" ? body.minutes : 0;

  const writingSession = await prisma.writingSession.upsert({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
    update: {
      wordCount: { increment: wordCount },
      minutes: { increment: minutes },
    },
    create: {
      userId: session.user.id,
      date: today,
      wordCount,
      minutes,
    },
  });

  return NextResponse.json(writingSession);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const startDate = sevenDaysAgo.toISOString().slice(0, 10);

  const sessions = await prisma.writingSession.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(sessions);
}
