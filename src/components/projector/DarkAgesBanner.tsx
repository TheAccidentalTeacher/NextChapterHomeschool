"use client";

interface DarkAgesBannerProps {
  teamName: string;
  epoch: number;
}

export default function DarkAgesBanner({ teamName, epoch }: DarkAgesBannerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="mx-8 max-w-lg rounded-2xl border border-red-900 bg-stone-950 p-8 text-center shadow-2xl">
        <div className="mb-4 text-6xl">🌑</div>
        <h2 className="text-3xl font-bold text-red-500">DARK AGE</h2>
        <p className="mt-3 text-lg text-stone-400">
          {teamName} has entered a Dark Age in Epoch {epoch}.
        </p>
        <p className="mt-2 text-sm text-stone-500">
          All yields reduced by 50%. Expansion locked. Only spot trades allowed.
        </p>
        <div className="mt-6 text-xs text-stone-600">
          Recovery requires population ≥ 5 and resilience ≥ 10
        </div>
      </div>
    </div>
  );
}
