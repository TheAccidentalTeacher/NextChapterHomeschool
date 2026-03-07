"use client";

// ============================================
// Epilogue Vote Page — Class Superlative Vote
// Decision 68: Every student votes for OTHER teams
// No self-voting, submit once, no changes
// ============================================

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface Team {
  id: string;
  name: string;
}

const CATEGORIES = [
  {
    id: "most_ruthless",
    label: "Most Ruthless Civilization",
    emoji: "⚔️",
  },
  {
    id: "most_surprising_comeback",
    label: "Most Surprising Comeback",
    emoji: "🔄",
  },
  {
    id: "best_diplomat",
    label: "Best Diplomat",
    emoji: "🤝",
  },
  {
    id: "most_feared",
    label: "Civilization We Most Feared",
    emoji: "😨",
  },
  {
    id: "wished_we_were",
    label: "Civilization We Wished We Were",
    emoji: "✨",
  },
];

export default function EpilogueVotePage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.gameId as string | undefined;

  const [teams, setTeams] = useState<Team[]>([]);
  const [myTeamId, setMyTeamId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!gameId) return;

      // Get team info
      const teamRes = await fetch("/api/me/team");
      const teamData = await teamRes.json();
      setMyTeamId(teamData.teamId);

      // Get all teams
      const teamsRes = await fetch(`/api/games/${gameId}/teams`);
      const teamsData = await teamsRes.json();
      setTeams(teamsData.teams ?? []);

      // Check if already voted
      const voteRes = await fetch(`/api/epilogue/vote?game_id=${gameId}`);
      const voteData = await voteRes.json();
      if (voteData.hasVoted) {
        setAlreadyVoted(true);
      }
    }
    load();
  }, [gameId]);

  const otherTeams = teams.filter((t) => t.id !== myTeamId);

  function handleVote(category: string, teamId: string) {
    setVotes((prev) => ({ ...prev, [category]: teamId }));
  }

  async function handleSubmit() {
    // Validate all categories voted
    const missing = CATEGORIES.filter((c) => !votes[c.id]);
    if (missing.length > 0) {
      setError(`Please vote in all categories. Missing: ${missing.map((m) => m.label).join(", ")}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/epilogue/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId,
          votes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Vote submission failed");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadyVoted || submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🗳️</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Vote Submitted!
          </h1>
          <p className="text-gray-400">
            Your votes have been recorded. Results will be revealed on the projector by Scott.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="mt-6 rounded-lg bg-blue-700 px-6 py-2 text-white hover:bg-blue-600"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold text-amber-400 text-center mb-2">
          🏆 Class Superlatives
        </h1>
        <p className="text-center text-gray-400 mb-8">
          Vote for OTHER teams in each category. No self-voting. Submit once — no changes.
        </p>

        <div className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="rounded-xl border border-gray-700 bg-gray-900 p-4"
            >
              <h2 className="text-lg font-bold text-white mb-3">
                {cat.emoji} {cat.label}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {otherTeams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => handleVote(cat.id, team.id)}
                    className={`rounded-lg border p-3 text-left text-sm transition-all ${
                      votes[cat.id] === team.id
                        ? "border-amber-500 bg-amber-900/30 text-white"
                        : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-8 w-full rounded-xl bg-amber-700 py-3 text-center font-bold text-white text-lg hover:bg-amber-600 disabled:opacity-50 transition-all"
        >
          {submitting ? "Submitting..." : "🗳️ Submit My Votes"}
        </button>

        <p className="mt-3 text-center text-xs text-gray-600">
          Votes are final. You cannot change them after submission.
        </p>
      </div>
    </div>
  );
}
