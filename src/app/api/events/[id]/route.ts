import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authOk(req: NextRequest): boolean {
  if (!env.dashboardToken) return true;
  const provided =
    req.headers.get("x-dashboard-token") ||
    req.nextUrl.searchParams.get("token") ||
    "";
  return provided === env.dashboardToken;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const event = await prisma.webhookEvent.findUnique({
    where: { id: params.id },
    include: { attempts: { orderBy: { attemptNo: "asc" } } },
  });
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ event });
}
