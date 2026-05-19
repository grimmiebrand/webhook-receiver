# Deploy in 5 minutes (zero-jargon version)

You don't need to understand any of the code. Just follow these four boxes.

## Box 1 — Install the tools (one time)

Open Terminal on your Mac and paste these one at a time:

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install git and the GitHub CLI
brew install git gh
```

## Box 2 — Push the code to GitHub

In Terminal, navigate to this folder and run:

```bash
cd "/path/to/webhook-app"     # ← replace with the real path
gh auth login                 # ← follow the prompts; pick "GitHub.com" → "HTTPS" → "Login with a web browser"
git init
git add .
git commit -m "Initial commit"
gh repo create webhook-receiver --public --source=. --remote=origin --push
```

When this finishes you'll have a GitHub link printed in the terminal. That's your repo.

## Box 3 — Deploy on Render

1. Go to <https://dashboard.render.com>. Sign up if you don't have an account (free).
2. Click the big **New +** button → choose **Blueprint**.
3. Click **Connect a repository** and pick `webhook-receiver`.
4. Render reads the included `render.yaml` and shows you what it'll create: a web app + a database. Click **Apply**.
5. Wait 3–5 minutes for the first build. You'll see a green "Live" badge when it's done.

The page will show you a URL like `https://webhook-receiver-xxxx.onrender.com`. Open it. You should see the landing page.

## Box 4 — Send your first webhook

1. In Render, open your service → **Environment** tab.
2. Find `GENERIC_SECRET` and copy its value.
3. In Terminal, paste this (replace the two placeholders):

```bash
SECRET="paste-the-GENERIC_SECRET-here"
URL="https://YOUR_APP.onrender.com/api/webhooks/generic"

BODY='{"id":"evt_001","type":"test","amount":42}'
SIG=$(printf "%s" "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)
curl -X POST "$URL" -H "Content-Type: application/json" -H "X-Webhook-Signature: $SIG" -d "$BODY"
```

4. Open `https://YOUR_APP.onrender.com/dashboard` — your event is there.

## When something needs changing

Edit a file, then in Terminal:

```bash
git add .
git commit -m "what you changed in plain English"
git push
```

Render rebuilds and re-deploys automatically. ~2 minutes.

## What if something goes wrong

- **Build fails on Render**: open the Render service → **Logs** tab. The error is usually in the last 20 lines. Send it to Claude and ask for a fix.
- **Webhook returns 401 `signature_failed`**: the secret you used to sign doesn't match the one in Render's environment. Re-copy it.
- **Dashboard is empty**: send a webhook (Box 4) and refresh.
- **`gh: command not found`**: re-run Box 1.
