import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-8 shadow-soft max-w-xl">
      <div className="text-xs uppercase text-ink-400">404</div>
      <h1 className="text-2xl font-semibold tracking-tight mt-1">Not found</h1>
      <p className="mt-2 text-ink-500 text-sm">
        That page or event doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="inline-block mt-6 rounded-full bg-ink-900 text-white px-4 py-2 text-sm hover:bg-ink-700"
      >
        Home
      </Link>
    </div>
  );
}
