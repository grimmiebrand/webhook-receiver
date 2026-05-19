// Webhook receiver endpoint.
// POST /api/webhooks/<source>
//
// - Validates source is in ALLOWED_SOURCES
// - Per-source HMAC signature validation (header: X-Webhook-Signature or Stripe-Signature)
// - Rate limit per IP + source
// - Persists event before kicking off async processing (durable)
// - Idempotency via (source, externalId) unique constraint
// - Returns 200 fast (acks); processing runs after response

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { log } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { verifySignature } from "@/lib/signature";
import { env, isSourceAllowed, secretForSource } from "@/lib/env";
import { processEvent } from "@/lib/processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIG_HEADERS = ["x-webhook-signature", "stripe-signature", "x-hub-signature-256"];

function pickSignature(headers: Headers): string | null {
  for (const h of SIG_HEADERS) {
    const v = headers.get(h);
    if (v) return v;
  }
  return null;
}

function pickExternalId(headers: Headers, body: unknown): string | null {
  const headerId =
    headers.get("x-webhook-id") ||
    headers.get("stripe-event-id") ||
    headers.get("x-github-delivery");
  if (headerId) return headerId;
  if (body && typeof body === "object" && "id" in body) {
    const id = (body as Record<string, unknown>).id;
    if (typeof id === "string") return id;
  }
  return null;
}

function pickEventType(headers: Headers, body: unknown): string | null {
  const headerType = headers.get("x-event-type") || headers.get("x-github-event");
  if (headerType) return headerType;
  if (body && typeof body === "object" && "type" in body) {
    const t = (body as Record<string, unknown>).type;
    if (typeof t === "string") return t;
  }
  return null;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function headerObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((v, k) => {
    // Strip auth-ish headers so we never persist secrets verbatim
    if (/^(authorization|cookie|x-api-key)$/i.test(k)) return;
    obj[k] = v;
  });
  return obj;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { source: string } }
) {
  const source = params.source.toLowerCase();
  const ip = clientIp(req);

  if (!isSourceAllowed(source)) {
    log.warn("webhook.source_not_allowed", { source, ip });
    return NextResponse.json({ error: "unknown_source" }, { status: 404 });
  }

  const rl = rateLimit(`${source}:${ip}`, env.rateLimitPerMinute);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  // Read the raw body once — required for HMAC.
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (e) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (rawBody.length > 1_000_000) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let parsed: unknown = null;
  try {
    parsed = rawBody.length ? JSON.parse(rawBody) : {};
  } catch {
    parsed = { _raw: rawBody.slice(0, 2000) };
  }
  // Prisma's Json field accepts objects/arrays but not bare nulls/strings — wrap them.
  if (parsed === null || typeof parsed !== "object") {
    parsed = { _value: parsed };
  }

  const secret = secretForSource(source);
  const signature = pickSignature(req.headers);
  const verdict = secret
    ? verifySignature({ rawBody, signatureHeader: signature, secret })
    : { ok: false, reason: "no_secret_configured" as const };

  // Persist the event first — we keep a record even if signature failed (audit trail).
  const externalId = pickExternalId(req.headers, parsed);
  const eventType = pickEventType(req.headers, parsed);

  let eventId: string | null = null;
  let isNewEvent = false;
  try {
    const created = await prisma.webhookEvent.create({
      data: {
        source,
        eventType,
        externalId,
        payload: parsed as object,
        headers: headerObject(req.headers) as object,
        signature,
        signatureOk: verdict.ok,
        ipAddress: ip,
        status: verdict.ok ? "RECEIVED" : "REJECTED",
        errorMessage: verdict.ok ? null : verdict.reason ?? "signature_failed",
      },
    });
    eventId = created.id;
    isNewEvent = true;
  } catch (err) {
    // Prisma P2002 = unique constraint violation on (source, externalId) — duplicate.
    const code = (err as { code?: string } | null)?.code;
    if (code === "P2002") {
      log.info("webhook.deduped", { source, externalId });
      return NextResponse.json({ ok: true, deduped: true }, { status: 200 });
    }
    log.error("webhook.persist_error", {
      source,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "persist_failed" }, { status: 500 });
  }

  log.info("webhook.received", {
    eventId,
    source,
    eventType,
    externalId,
    signatureOk: verdict.ok,
    ip,
  });

  if (!verdict.ok) {
    return NextResponse.json(
      { error: "signature_failed", reason: verdict.reason },
      { status: 401 }
    );
  }

  // Fire-and-forget async processing. Render keeps the process alive between
  // requests, so this completes after the 200 is returned.
  if (isNewEvent && eventId) {
    processEvent(eventId).catch((e) => {
      log.error("webhook.processor_unhandled", {
        eventId,
        error: e instanceof Error ? e.message : String(e),
      });
    });
  }

  return NextResponse.json({ ok: true, eventId }, { status: 200 });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: "POST a webhook here" });
}
