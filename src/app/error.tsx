"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-950 px-6 py-10 text-stone-100">
      <div className="w-full max-w-lg rounded-2xl border border-red-800/40 bg-stone-900/80 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <h1 className="text-xl font-bold text-red-300">Application Error</h1>
            <p className="text-sm text-stone-400">
              Something went wrong while loading this page.
            </p>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-stone-800 bg-stone-950/60 p-4 text-sm text-stone-300">
          <p>
            If you typed the wrong username or password, or got stuck on the wrong account,
            use one of the buttons below and sign in again.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-stone-400">
            <li>Try reloading this page</li>
            <li>Go back to the sign-in page</li>
            <li>Log out completely and sign in again</li>
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
          >
            Retry page
          </button>

          <Link
            href="/sign-in"
            className="rounded-lg border border-stone-700 bg-stone-900 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-500 hover:bg-stone-800"
          >
            Go to sign-in
          </Link>

          <SignOutButton>
            <button
              type="button"
              className="rounded-lg border border-red-800/50 bg-red-900/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-900/40"
            >
              ↩ Log out
            </button>
          </SignOutButton>
        </div>
      </div>
    </main>
  );
}
