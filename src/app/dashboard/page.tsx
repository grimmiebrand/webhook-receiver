import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    SUCCEEDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    REJECTED: "bg-amber-50 text-amber-700 border-amber-200",
    PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
    RECEIVED: "bg-ink-50 text-ink-700 border-ink-200",
  };
  return (
    <span
      className={`text-[11px] uppercase tracking-wide rounded-full border px-2 py-0.5 ${
        styles[status] ?? "bg-ink-50 border-ink-200"
      }`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function fmt(d: Date | null) {
  if (!d) return "—";
  const date = new Date(d);
  return date.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

async function loadData() {
  try {
    const [events, counts] = await Promise.all([
      prisma.webhookEvent.findMany({
        orderBy: { receivedAt: "desc" },
        take: 100,
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
      }),
      prisma.webhookEvent.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
    ]);
    return { events, counts, dbOk: true as const, error: null };
  } catch (e) {
    return {
      events: [],
      counts: [],
      dbOk: false as const,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function DashboardPage() {
  const { events, counts, dbOk, error } = await loadData();
  const countFor = (s: string) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-ink-500 text-sm mt-1">
            Latest 100 webhook events across all sources.
          </p>
        </div>
        <a
          href="/dashboard"
          className="rounded-full border border-ink-200 px-3 py-1.5 text-xs hover:bg-white"
        >
          Refresh
        </a>
      </div>

      {!dbOk && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <div className="font-medium">Database not reachable</div>
          <div className="mt-1 text-amber-700">{error}</div>
          <div className="mt-2 text-amber-700">
            Set <code className="font-mono">DATABASE_URL</code> and run{" "}
            <code className="font-mono">prisma migrate deploy</code>.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ["RECEIVED", "Received"],
          ["PROCESSING", "Processing"],
          ["SUCCEEDED", "Succeeded"],
          ["FAILED", "Failed"],
          ["REJECTED", "Rejected"],
        ].map(([key, label]) => (
          <div
            key={key}
            className="rounded-2xl border border-ink-100 bg-white p-4 shadow-soft"
          >
            <div className="text-xs text-ink-400 uppercase tracking-wide">
              {label}
            </div>
            <div className="text-2xl font-semibold mt-1">{countFor(key)}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-500">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Received</th>
              <th className="text-left font-medium px-4 py-2.5">Source</th>
              <th className="text-left font-medium px-4 py-2.5">Type</th>
              <th className="text-left font-medium px-4 py-2.5">Status</th>
              <th className="text-left font-medium px-4 py-2.5">Sig</th>
              <th className="text-left font-medium px-4 py-2.5">Error</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-400">
                  No events yet. Send a POST to{" "}
                  <code className="font-mono">/api/webhooks/generic</code> to see one land here.
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-t border-ink-100 hover:bg-ink-50/50">
                <td className="px-4 py-2.5 font-mono text-xs text-ink-500">
                  {fmt(e.receivedAt)}
                </td>
                <td className="px-4 py-2.5">{e.source}</td>
                <td className="px-4 py-2.5 text-ink-500">{e.eventType ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={e.status} />
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`text-xs ${
                      e.signatureOk ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {e.signatureOk ? "ok" : "fail"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-ink-500 max-w-xs truncate">
                  {e.errorMessage ?? ""}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Link
                    href={`/events/${e.id}`}
                    className="text-xs underline underline-offset-2 hover:text-ink-900 text-ink-500"
                  >
                    view
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
