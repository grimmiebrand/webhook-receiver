import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Webhook Receiver",
  description: "Production-grade webhook ingestion with signed payloads, retries, and a logs dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans text-ink-900">
        <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-ink-100">
          <nav className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight">
              ◗ webhooks
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/dashboard" className="hover:opacity-70">Dashboard</Link>
              <Link href="/docs" className="hover:opacity-70">Docs</Link>
              <a
                href="/api/health"
                className="rounded-full border border-ink-200 px-3 py-1 hover:bg-ink-50"
              >
                Health
              </a>
            </div>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
        <footer className="max-w-5xl mx-auto px-6 py-10 text-xs text-ink-400">
          Built for production · self-hosted on Render
        </footer>
      </body>
    </html>
  );
}
