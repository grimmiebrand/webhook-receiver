// Render-compatible health check. Pings DB so it catches outages.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  let dbOk = false;
  let dbError: string | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (e) {
    dbError = e instanceof Error ? e.message : String(e);
  }
  const ok = dbOk;
  return NextResponse.json(
    {
      ok,
      uptimeMs: process.uptime() * 1000,
      checks: {
        db: { ok: dbOk, error: dbError },
      },
      latencyMs: Date.now() - startedAt,
      now: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 }
  );
}
