import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import htmlToDocx from "html-to-docx";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const html = body.html as string;

  if (!html) {
    return NextResponse.json({ error: "HTML content is required" }, { status: 400 });
  }

  const fullHtml = `<!DOCTYPE html><html><body>${html}</body></html>`;
  const buffer = await htmlToDocx(fullHtml, undefined, {
    table: { row: { cantSplit: true } },
    footer: true,
    pageNumber: true,
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="uppsats.docx"',
    },
  });
}
