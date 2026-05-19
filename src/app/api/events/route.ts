// Read-only event list for the dashboard.
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const ALLOWED_STATUSES = ["RECEIVED", "PROCESSING", "SUCCEEDED", "FAILED", "REJECTED"] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

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

export async function GET(req: NextRequest) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl;
  const source = url.searchParams.get("source") || undefined;
  const statusRaw = url.searchParams.get("status");
  const status =
    statusRaw && (ALLOWED_STATUSES as readonly string[]).includes(statusRaw)
      ? (statusRaw as AllowedStatus)
      : undefined;
  const take = Math.min(Number(url.searchParams.get("limit") || "50"), 200);

  const where: Prisma.WebhookEventWhereInput = {
    ...(source ? { source } : {}),
    ...(status ? { status } : {}),
  };

  const events = await prisma.webhookEvent.findMany({
    where,
    orderBy: { receivedAt: "desc" },
    take,
    select: {
      id: true,
      source: true,
      eventType: true,
      status: true,
      signatureOk: true,
      receivedAt: true,
      processedAt: true,
      errorMessage: true,
    },
  });

  return NextResponse.json({ events });
}
