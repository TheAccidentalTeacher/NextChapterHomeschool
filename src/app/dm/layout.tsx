import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/roles";
import Link from "next/link";

export default async function DmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();
  if (role !== "teacher") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* DM Navigation Bar */}
      <nav className="border-b border-stone-800 bg-stone-900/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
          <Link href="/dm" className="text-lg font-bold text-red-400">
            🎮 DM Panel
          </Link>
          <div className="flex gap-4 text-sm">
            <Link
              href="/dm"
              className="text-stone-400 transition hover:text-stone-200"
            >
              Overview
            </Link>
            <Link
              href="/dm/setup"
              className="text-stone-400 transition hover:text-stone-200"
            >
              New Game
            </Link>
            <Link
              href="/dm/roster"
              className="text-stone-400 transition hover:text-stone-200"
            >
              Roster
            </Link>
            <Link
              href="/dm/names"
              className="text-stone-400 transition hover:text-stone-200"
            >
              Names
            </Link>
            <Link
              href="/dm"
              className="text-stone-400 transition hover:text-stone-200"
            >
              Games
            </Link>
          </div>
          <div className="ml-auto text-xs text-stone-600">
            Teacher View
          </div>
        </div>
      </nav>

      {/* DM Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
