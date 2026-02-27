import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { summarizeAbstract } from "@/lib/ai/summarizer";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`summarize:${session.user.id}`, 10);
  if (!rl.success) {
    return NextResponse.json(
      { error: "För många förfrågningar. Försök igen om en stund." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  const body = await request.json();
  const { title, abstract, researchItemId } = body;

  if (!title) {
    return NextResponse.json(
      { error: "Titel krävs" },
      { status: 400 }
    );
  }

  // If we have a researchItemId, check if there's a cached summary
  if (researchItemId) {
    const existing = await prisma.researchItem.findUnique({
      where: { id: researchItemId },
      select: { summary: true },
    });

    if (existing?.summary) {
      return NextResponse.json({ summary: existing.summary, cached: true });
    }
  }

  try {
    const summary = await summarizeAbstract(title, abstract);

    // Cache the summary if we have a researchItemId
    if (researchItemId) {
      await prisma.researchItem.update({
        where: { id: researchItemId },
        data: { summary },
      });
    }

    return NextResponse.json({ summary, cached: false });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Okänt fel";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
