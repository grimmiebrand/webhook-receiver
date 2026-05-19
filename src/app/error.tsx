"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-soft max-w-xl">
      <div className="text-xs uppercase text-ink-400">Something went wrong</div>
      <h1 className="text-2xl font-semibold tracking-tight mt-1">
        Unexpected error
      </h1>
      <p className="mt-2 text-ink-500 text-sm break-all">{error.message}</p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={reset}
          className="rounded-full bg-ink-900 text-white px-4 py-2 text-sm hover:bg-ink-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-full border border-ink-200 px-4 py-2 text-sm hover:bg-ink-50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
