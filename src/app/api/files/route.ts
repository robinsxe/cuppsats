import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { validateFile, sanitizeFileName, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/lib/file-utils";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folderId = request.nextUrl.searchParams.get("folderId");

  const files = await prisma.researchFile.findMany({
    where: folderId ? { folderId } : {},
    orderBy: { createdAt: "desc" },
    include: {
      uploader: { select: { id: true, name: true } },
      folder: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(files);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folderId = (formData.get("folderId") as string) || null;

  if (!file) {
    return NextResponse.json({ error: "Fil krävs" }, { status: 400 });
  }

  // Server-side validation
  const validationError = validateFile({ size: file.size, type: file.type });
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  // Validate folder if provided
  if (folderId) {
    const folder = await prisma.researchFolder.findUnique({ where: { id: folderId } });
    if (!folder) {
      return NextResponse.json({ error: "Mappen finns inte" }, { status: 400 });
    }
  }

  const safeName = sanitizeFileName(file.name);
  const blobPath = `research/${Date.now()}-${safeName}`;

  const blob = await put(blobPath, file, {
    access: "public",
    contentType: file.type,
  });

  const researchFile = await prisma.researchFile.create({
    data: {
      name: safeName,
      blobUrl: blob.url,
      blobPath: blobPath,
      mimeType: file.type,
      size: file.size,
      folderId,
      uploaderId: session.user.id,
    },
    include: {
      uploader: { select: { id: true, name: true } },
      folder: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(researchFile, { status: 201 });
}
