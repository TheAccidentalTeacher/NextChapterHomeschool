"use client";

interface DailyRecapCardProps {
  recapText: string;
  epoch: number;
  teamName?: string;
}

export default function DailyRecapCard({
  recapText,
  epoch,
  teamName,
}: DailyRecapCardProps) {
  return (
    <div className="rounded-2xl border border-stone-700 bg-stone-900/80 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-amber-400">
            📜 Daily Recap
          </h2>
          {teamName && (
            <p className="text-sm text-stone-500">{teamName}</p>
          )}
        </div>
        <span className="rounded bg-stone-800 px-2 py-0.5 text-xs text-stone-400">
          Epoch {epoch}
        </span>
      </div>
      <div className="prose prose-sm prose-invert max-w-none">
        <p className="whitespace-pre-wrap leading-relaxed text-stone-300">
          {recapText}
        </p>
      </div>
    </div>
  );
}
