// Async webhook processing with bounded retries + exponential backoff.
// Processes a single event end-to-end and records DeliveryAttempt rows.
import { prisma } from "./db";
import { log } from "./logger";

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 500;

// Simulated/customizable handler: this is where you'd dispatch business logic
// based on the source + eventType. Replace with your real integration.
async function handle(event: { source: string; eventType: string | null; payload: unknown }) {
  // Example: route based on source
  switch (event.source) {
    case "stripe":
      // e.g. update order, send receipt, etc.
      break;
    case "github":
      // e.g. trigger build, notify chat
      break;
    default:
      // generic handler — just succeed
      break;
  }
  // Intentionally a no-op so the template ships clean. Throw to test retries.
}

export async function processEvent(eventId: string): Promise<void> {
  const event = await prisma.webhookEvent.findUnique({ where: { id: eventId } });
  if (!event) {
    log.warn("processor.event_not_found", { eventId });
    return;
  }

  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: { status: "PROCESSING" },
  });

  let attemptNo = 0;
  let lastError: string | null = null;

  while (attemptNo < MAX_ATTEMPTS) {
    attemptNo += 1;
    const startedAt = Date.now();
    try {
      await handle({
        source: event.source,
        eventType: event.eventType,
        payload: event.payload,
      });
      const durationMs = Date.now() - startedAt;
      await prisma.deliveryAttempt.create({
        data: { eventId, attemptNo, success: true, durationMs },
      });
      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: { status: "SUCCEEDED", processedAt: new Date(), errorMessage: null },
      });
      log.info("processor.success", { eventId, source: event.source, attemptNo, durationMs });
      return;
    } catch (err) {
      const durationMs = Date.now() - startedAt;
      lastError = err instanceof Error ? err.message : String(err);
      await prisma.deliveryAttempt.create({
        data: { eventId, attemptNo, success: false, durationMs, errorMessage: lastError },
      });
      log.warn("processor.attempt_failed", { eventId, attemptNo, error: lastError });
      if (attemptNo >= MAX_ATTEMPTS) break;
      const delay = BASE_DELAY_MS * 2 ** (attemptNo - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  await prisma.webhookEvent.update({
    where: { id: eventId },
    data: { status: "FAILED", processedAt: new Date(), errorMessage: lastError },
  });
  log.error("processor.exhausted", { eventId, attempts: attemptNo, error: lastError });
}
