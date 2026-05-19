export default function DocsPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">How it works</h1>
        <p className="text-ink-500 mt-2">
          Three minutes to your first signed webhook.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">1. The endpoint</h2>
        <p className="text-ink-600 leading-relaxed">
          Send a POST to{" "}
          <code className="font-mono text-sm bg-ink-50 px-1.5 py-0.5 rounded">
            /api/webhooks/&lt;source&gt;
          </code>{" "}
          where{" "}
          <code className="font-mono text-sm bg-ink-50 px-1.5 py-0.5 rounded">
            &lt;source&gt;
          </code>{" "}
          is one of the entries in your{" "}
          <code className="font-mono text-sm bg-ink-50 px-1.5 py-0.5 rounded">
            ALLOWED_SOURCES
          </code>{" "}
          env var (default:{" "}
          <code className="font-mono text-sm">generic, stripe, github</code>).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">2. Signing the payload</h2>
        <p className="text-ink-600 leading-relaxed">
          Each source has a secret (env var{" "}
          <code className="font-mono text-sm bg-ink-50 px-1.5 py-0.5 rounded">
            &lt;SOURCE&gt;_SECRET
          </code>
          ). Sign the raw request body with HMAC-SHA256 and send the hex digest
          in the{" "}
          <code className="font-mono text-sm bg-ink-50 px-1.5 py-0.5 rounded">
            X-Webhook-Signature
          </code>{" "}
          header. Stripe (
          <code className="font-mono text-sm">Stripe-Signature</code>) and
          GitHub (<code className="font-mono text-sm">X-Hub-Signature-256</code>
          ) formats are also accepted.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">3. Test it from your terminal</h2>
        <pre className="rounded-2xl border border-ink-100 bg-white p-4 text-xs font-mono whitespace-pre-wrap shadow-soft overflow-x-auto">
{`# Replace SECRET with your GENERIC_SECRET value
BODY='{"id":"evt_001","type":"test","amount":42}'
SIG=$(printf "%s" "$BODY" | openssl dgst -sha256 -hmac "SECRET" | cut -d' ' -f2)
curl -X POST https://YOUR_APP.onrender.com/api/webhooks/generic \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: $SIG" \\
  -d "$BODY"`}
        </pre>
        <p className="text-ink-500 text-sm">
          Then open the <a href="/dashboard" className="underline">Dashboard</a>{" "}
          to see the event.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">4. What the server does</h2>
        <ul className="text-ink-600 leading-relaxed list-disc pl-5 space-y-1">
          <li>Rate-limits by IP + source.</li>
          <li>Reads the raw body and verifies the HMAC in constant time.</li>
          <li>Persists the event before processing (durable).</li>
          <li>De-duplicates by source + external id.</li>
          <li>Acks fast with 200, processes asynchronously.</li>
          <li>Retries failed handlers up to 5 times with exponential backoff.</li>
          <li>Records every attempt in the dashboard.</li>
        </ul>
      </section>
    </div>
  );
}
