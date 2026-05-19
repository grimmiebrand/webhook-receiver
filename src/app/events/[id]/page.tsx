import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: { id: string } }) {
  let event;
  try {
    event = await prisma.webhookEvent.findUnique({
      where: { id: params.id },
      include: { attempts: { orderBy: { attemptNo: "asc" } } },
    });
  } catch {
    event = null;
  }
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-ink-500 hover:text-ink-900"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight mt-2 font-mono">
          {event.id}
        </h1>
        <div className="text-sm text-ink-500 mt-1">
          {event.source}
          {event.eventType ? ` · ${event.eventType}` : ""} ·{" "}
          {new Date(event.receivedAt).toISOString()}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
          <div className="text-xs uppercase text-ink-400">Status</div>
          <div className="mt-1">{event.status}</div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft">
          <div className="text-xs uppercase text-ink-400">Signature</div>
          <div className="mt-1">{event.signatureOk ? "verified" : "failed"}</div>
        </div>
        {event.errorMessage && (
          <div className="md:col-span-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {event.errorMessage}
          </div>
        )}
      </div>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-ink-400 mb-2">
          Delivery attempts
        </h2>
        <div className="rounded-2xl border border-ink-100 bg-white shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-ink-500">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">#</th>
                <th className="text-left font-medium px-4 py-2.5">Result</th>
                <th className="text-left font-medium px-4 py-2.5">Duration</th>
                <th className="text-left font-medium px-4 py-2.5">When</th>
                <th className="text-left font-medium px-4 py-2.5">Error</th>
              </tr>
            </thead>
            <tbody>
              {event.attempts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-400">
                    No delivery attempts recorded.
                  </td>
                </tr>
              )}
              {event.attempts.map((a) => (
                <tr key={a.id} className="border-t border-ink-100">
                  <td className="px-4 py-2.5 font-mono">{a.attemptNo}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={
                        a.success ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {a.success ? "ok" : "fail"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">{a.durationMs} ms</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-ink-500">
                    {new Date(a.createdAt).toISOString()}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-500">
                    {a.errorMessage ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-ink-400 mb-2">
          Payload
        </h2>
        <pre className="rounded-2xl border border-ink-100 bg-white p-4 text-xs font-mono whitespace-pre-wrap break-all shadow-soft overflow-x-auto">
{JSON.stringify(event.payload, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="text-sm uppercase tracking-wide text-ink-400 mb-2">
          Headers
        </h2>
        <pre className="rounded-2xl border border-ink-100 bg-white p-4 text-xs font-mono whitespace-pre-wrap break-all shadow-soft overflow-x-auto">
{JSON.stringify(event.headers, null, 2)}
        </pre>
      </section>
    </div>
  );
}
