# Webhook Receiver

Production-grade webhook ingestion: signed payloads, durable persistence, retries with backoff, an audit dashboard, and a one-click Render deploy.

## What you get

- **Endpoint**: `POST /api/webhooks/<source>` (e.g. `/api/webhooks/stripe`)
- **Signature verification**: HMAC-SHA256, timing-safe, supports Stripe (`Stripe-Signature`), GitHub (`X-Hub-Signature-256`), and generic (`X-Webhook-Signature`) formats
- **Rate limiting** per IP + source
- **Idempotency** via `(source, externalId)` unique key
- **Async processing** with up to 5 retries and exponential backoff
- **Full audit log** in Postgres — every payload, header, attempt, and outcome
- **Dashboard** at `/dashboard` to browse events; detail view at `/events/<id>`
- **Health check** at `/api/health` (verifies DB connectivity)

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL · Render

## Deploy in 5 minutes

You'll do this once. Everything after that auto-deploys when you push to GitHub.

### Step 1 — Push this folder to GitHub

In your terminal, from the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create webhook-receiver --public --source=. --remote=origin --push
```

> Don't have the `gh` CLI? Create the repo on github.com, then:
> ```bash
> git remote add origin https://github.com/<your-user>/webhook-receiver.git
> git branch -M main
> git push -u origin main
> ```

### Step 2 — Deploy on Render

1. Sign in at <https://dashboard.render.com>.
2. Click **New +** → **Blueprint**.
3. Connect the GitHub repo you just pushed.
4. Render reads `render.yaml` and shows you the plan: one web service + one Postgres database. Click **Apply**.
5. Wait ~3–5 minutes for the first build. Done.

After it deploys, Render gives you a URL like `https://webhook-receiver-xxxx.onrender.com`. That's your live app.

### Step 3 — Send a test webhook

Grab your `GENERIC_SECRET` from the Render dashboard (Environment tab), then:

```bash
SECRET="paste-your-GENERIC_SECRET-here"
URL="https://YOUR_APP.onrender.com/api/webhooks/generic"
BODY='{"id":"evt_001","type":"test","amount":42}'
SIG=$(printf "%s" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

curl -X POST "$URL" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: $SIG" \
  -d "$BODY"
```

Open `https://YOUR_APP.onrender.com/dashboard` — your event should be there.

## Run locally

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL (e.g. local Postgres or Render external URL)

npm install
npx prisma migrate dev --name init
npm run dev
```

Open <http://localhost:3000>.

## Environment variables

| Var | Required | What it does |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string. Render injects automatically. |
| `ALLOWED_SOURCES` | yes | Comma-separated source slugs that the receiver accepts (e.g. `generic,stripe,github`). |
| `<SOURCE>_SECRET` | yes | HMAC secret for each source (e.g. `GENERIC_SECRET`, `STRIPE_SECRET`). Render auto-generates `GENERIC_SECRET` and `DASHBOARD_TOKEN`. |
| `DASHBOARD_TOKEN` | no | If set, dashboard API requires `?token=` or `X-Dashboard-Token` header. |
| `RATE_LIMIT_PER_MINUTE` | no | Default `120`. Per IP + source. |
| `LOG_LEVEL` | no | `debug` \| `info` \| `warn` \| `error`. Default `info`. |

## Adding a new webhook source

1. Add the slug to `ALLOWED_SOURCES` (e.g. `generic,stripe,github,shopify`).
2. Add a matching env var: `SHOPIFY_SECRET=<your-secret>`.
3. (Optional) Add source-specific business logic in `src/lib/processor.ts`.
4. Commit + push — Render auto-deploys.

## Project structure

```
src/
  app/
    api/
      webhooks/[source]/route.ts   # The webhook endpoint
      events/route.ts              # Dashboard JSON list
      events/[id]/route.ts         # Single event detail JSON
      health/route.ts              # Health check
    dashboard/page.tsx             # Logs dashboard UI
    events/[id]/page.tsx           # Event detail UI
    docs/page.tsx                  # How-it-works doc
    page.tsx                       # Landing
    layout.tsx
    globals.css
    error.tsx
    not-found.tsx
  lib/
    db.ts            # Prisma client singleton
    env.ts           # Env access + validation
    logger.ts        # Structured JSON logger
    signature.ts     # HMAC verification (Stripe/GitHub/generic)
    rate-limit.ts    # In-memory token bucket
    processor.ts     # Async retry + handler
prisma/
  schema.prisma      # WebhookEvent + DeliveryAttempt
render.yaml          # Render Blueprint (web + db)
```

## Updating the app

```bash
# Make your changes locally
git add .
git commit -m "Describe what you changed"
git push
```

Render auto-deploys on every push to `main`.

## Troubleshooting

**Build fails on Render with `prisma generate` error** — Make sure `DATABASE_URL` is set in the Render environment.

**`signature_failed` responses** — The sender's secret must exactly match `<SOURCE>_SECRET` and the signature must be hex HMAC-SHA256 of the raw body.

**Dashboard shows "Database not reachable"** — Run `npx prisma migrate deploy` (Render does this automatically in the build command; locally, run `prisma migrate dev`).

## License

MIT
