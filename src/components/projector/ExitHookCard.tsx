"use client";

interface ExitHookCardProps {
  prompt: string;
  epoch: number;
}

const EXIT_PROMPTS = [
  "If your civilization could send one message to the future, what would it say?",
  "What was the biggest risk your team took today, and was it worth it?",
  "If you could change one decision from this epoch, what would it be?",
  "What does your civilization need most right now to survive?",
  "Describe your civilization's greatest achievement so far in one sentence.",
  "What historical civilization does yours most resemble right now?",
  "If a traveler visited your civilization, what would impress them most?",
  "What is your civilization's biggest vulnerability?",
];

export function getExitPrompt(epoch: number): string {
  return EXIT_PROMPTS[(epoch - 1) % EXIT_PROMPTS.length];
}

export default function ExitHookCard({ prompt, epoch }: ExitHookCardProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/95">
      <div className="mx-8 max-w-xl rounded-2xl border border-amber-700/50 bg-stone-900 p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl">🤔</div>
        <p className="text-xs text-stone-500">Epoch {epoch} — Exit Hook</p>
        <h2 className="mt-2 text-2xl font-bold leading-relaxed text-stone-200">
          {prompt}
        </h2>
        <p className="mt-6 text-sm text-stone-500">
          Think about this with your team. No wrong answers.
        </p>
      </div>
    </div>
  );
}
