import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  // If already signed in, skip the landing page entirely
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      {/* Logo / Title */}
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-amber-400">
          ClassCiv
        </h1>
        <p className="mt-2 text-lg text-stone-400">
          Classroom Civilization Simulation
        </p>
        <p className="mt-1 text-sm text-stone-500">
          5 Themes of Geography &middot; 6 Weeks &middot; 1 World
        </p>
      </div>

      {/* Entry Points */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/sign-in"
          className="rounded-lg bg-amber-600 px-8 py-3 text-center font-semibold text-white transition hover:bg-amber-500"
        >
          Student / Teacher Login
        </Link>
        <Link
          href="/projector"
          className="rounded-lg border border-stone-700 px-8 py-3 text-center font-semibold text-stone-300 transition hover:border-amber-600 hover:text-amber-400"
        >
          Projector View
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-xs text-stone-600">
        Next Chapter Homeschool &middot; Built for Mr. Somers&apos; classroom
      </p>
    </main>
  );
}
