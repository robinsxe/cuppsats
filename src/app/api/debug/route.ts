import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, unknown> = {};

  checks.DATABASE_URL_set = !!process.env.DATABASE_URL;
  checks.DATABASE_URL_prefix = process.env.DATABASE_URL?.substring(0, 20) + "...";
  checks.TURSO_AUTH_TOKEN_set = !!process.env.TURSO_AUTH_TOKEN;
  checks.NEXTAUTH_SECRET_set = !!process.env.NEXTAUTH_SECRET;

  try {
    const userCount = await prisma.user.count();
    checks.db_connected = true;
    checks.user_count = userCount;

    const users = await prisma.user.findMany({
      select: { email: true, role: true },
    });
    checks.users = users;
  } catch (e) {
    checks.db_connected = false;
    checks.db_error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(checks);
}
