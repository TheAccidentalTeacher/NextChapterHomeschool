import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  // Only teacher role can access /dm
  // In production, check Clerk publicMetadata.role === "teacher"
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="flex min-h-screen">
      {/* DM Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-stone-800 bg-stone-900 p-4 lg:block">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-red-400">DM Panel</h2>
          <p className="text-xs text-stone-500">Dungeon Master Controls</p>
        </div>
        <nav className="flex flex-col gap-2 text-sm text-stone-400">
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            🎮 Game Control
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            📋 Submissions
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            🎲 d20 Events
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            👥 Teams & Roster
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            💰 Economy Override
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            🗺️ Map Editor
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            📊 Analytics
          </span>
          <span className="rounded px-3 py-2 hover:bg-stone-800 hover:text-stone-200">
            🧮 Math Gate Toggle
          </span>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
