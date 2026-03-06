"use client";

import { useState } from "react";

interface JustificationFieldProps {
  grade: "6th" | "7_8th";
  role: string;
  onValueChange: (text: string) => void;
  value: string;
}

const SENTENCE_STARTERS: Record<string, string> = {
  architect:
    "As the Architect, I propose building [choice] because in [place/time], we learned that [fact]. This will help our civilization by [outcome].",
  merchant:
    "As the Merchant, I propose [choice] because civilizations like [name] showed that [fact]. This will grow our economy by [outcome].",
  diplomat:
    "As the Diplomat, I propose [choice] because in [historical context], we learned that [fact]. This decision will shape our future by [outcome].",
  lorekeeper:
    "As the Lorekeeper, I choose [choice] because in [civilization], [symbol/tradition] represented [value]. This will build our cultural identity by [outcome].",
  warlord:
    "As the Warlord, I order [choice] because [civilization] showed that [fact]. This will protect our people by [outcome].",
};

const GUIDED_QUESTIONS = [
  "What is your proposed action?",
  "What historical evidence supports this decision?",
  "What risks do you foresee, and how will you mitigate them?",
];

export default function JustificationField({
  grade,
  role,
  onValueChange,
  value,
}: JustificationFieldProps) {
  const sentenceCount = (value.match(/[.!?]+/g) || []).length;
  const isValid = sentenceCount >= 2;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Justify your decision
        <span className="text-gray-500 ml-2">
          ({sentenceCount}/2 sentences minimum)
        </span>
      </label>

      {grade === "6th" && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-xs text-gray-400">
          <p className="font-medium text-gray-300 mb-1">Sentence starter:</p>
          <p className="italic">
            {SENTENCE_STARTERS[role] ?? SENTENCE_STARTERS.architect}
          </p>
        </div>
      )}

      {grade === "7_8th" && (
        <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3 text-xs text-gray-400">
          <p className="font-medium text-gray-300 mb-1">Consider:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {GUIDED_QUESTIONS.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        rows={4}
        className={`
          w-full rounded-lg border bg-gray-900 px-3 py-2 text-sm text-white
          placeholder-gray-500 focus:outline-none focus:ring-2
          ${
            isValid
              ? "border-green-700 focus:ring-green-500"
              : "border-gray-600 focus:ring-blue-500"
          }
        `}
        placeholder="Write your justification here…"
      />

      {isValid && (
        <p className="text-xs text-green-400">✓ Justification meets minimum</p>
      )}
    </div>
  );
}
