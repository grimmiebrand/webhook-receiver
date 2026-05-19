import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="pt-10">
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
          Webhooks that don&apos;t drop.
        </h1>
        <p className="mt-5 text-lg text-ink-500 max-w-2xl">
          A signed, retried, audited webhook receiver. Point any service at it, watch every event land in your dashboard, and never lose a payload again.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-full bg-ink-900 text-white px-5 py-2.5 text-sm hover:bg-ink-700 transition"
          >
            Open dashboard
          </Link>
          <Link
            href="/docs"
            className="rounded-full border border-ink-200 px-5 py-2.5 text-sm hover:bg-white transition"
          >
            How it works
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        {[
          {
            title: "Signed & verified",
            body: "HMAC-SHA256 verification with timing-safe compare. Stripe and GitHub formats supported out of the box.",
          },
          {
            title: "Durable retries",
            body: "Every event is persisted before processing. Failed handlers retry with exponential backoff.",
          },
          {
            title: "Full audit log",
            body: "Every payload, header, attempt, and outcome is recorded. Browse and filter from the dashboard.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-ink-100 bg-white p-5 shadow-soft"
          >
            <div className="font-medium">{f.title}</div>
            <p className="mt-2 text-sm text-ink-500 leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-soft">
        <div className="text-sm text-ink-500">Endpoint</div>
        <div className="mt-1 font-mono text-base">
          POST <span className="text-ink-900">/api/webhooks/&lt;source&gt;</span>
        </div>
        <div className="mt-4 text-sm text-ink-500">Signature header</div>
        <div className="mt-1 font-mono text-sm">X-Webhook-Signature: &lt;hex hmac-sha256&gt;</div>
      </section>
    </div>
  );
}
