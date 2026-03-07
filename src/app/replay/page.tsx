import { Suspense } from "react";
import ReplayClient from "./ReplayClient";

interface Props {
  searchParams: Promise<{ game_id?: string }>;
}

export default async function ReplayPage({ searchParams }: Props) {
  const { game_id } = await searchParams;

  if (!game_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-400">
        <div className="text-center">
          <p className="text-2xl font-bold text-stone-300 mb-2">ClassCiv Replay</p>
          <p className="text-stone-500">Missing <code className="text-amber-400">?game_id=</code> in URL.</p>
          <p className="mt-4 text-sm text-stone-600">
            Run a simulation with <code className="text-amber-400">--cinematic</code> to get the replay URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stone-950 text-stone-500">
          Loading replay…
        </div>
      }
    >
      <ReplayClient gameId={game_id} />
    </Suspense>
  );
}
