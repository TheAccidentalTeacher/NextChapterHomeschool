// ============================================================
// BattleResolveForm — DM-facing form that POSTs /battles/resolve
// ============================================================
// Realms v1.5 Pass 2 follow-up — UI for the battle auto-mutation endpoint.
// Teacher enters:
//   - Attacker + defender team_ids
//   - Soldiers, barracks, walls for each
//   - Optional d20 rolls (auto-rolls on submit if left blank)
//   - Justification multipliers (0.5–2.0) per party
//   - Optional ally (third BattleParticipant) with soldiers_committed
//     (subset of their garrison) — enforces F9 min-1-commit validation
//   - Optional casus_belli text + conflict_flag_id link
//
// On submit, displays the full BattleResult + applied mutations,
// including the F4 last-sub-zone-preservation flag.
// ============================================================

"use client";

import { useState } from "react";

interface TeamRef {
  id: string;
  name: string;
  civilization_name: string | null;
}

interface BattleResolveFormProps {
  gameId: string;
  teams: TeamRef[];
  initialConflictFlagId?: string | null;
}

interface ParticipantFormState {
  team_id: string;
  soldiers: number;
  barracks: boolean;
  walls: boolean;
  d20_roll: string; // blank = auto-roll
  justification_multiplier: number;
}

interface AllyFormState extends ParticipantFormState {
  soldiers_committed: number;
}

function emptyParticipant(): ParticipantFormState {
  return { team_id: "", soldiers: 5, barracks: false, walls: false, d20_roll: "", justification_multiplier: 1.0 };
}

function emptyAlly(): AllyFormState {
  return { ...emptyParticipant(), soldiers_committed: 1 };
}

export default function BattleResolveForm(props: BattleResolveFormProps) {
  const { gameId, teams, initialConflictFlagId } = props;

  const [attacker, setAttacker] = useState<ParticipantFormState>(emptyParticipant());
  const [defender, setDefender] = useState<ParticipantFormState>(emptyParticipant());
  const [useAlly, setUseAlly] = useState(false);
  const [ally, setAlly] = useState<AllyFormState>(emptyAlly());
  const [casusBelli, setCasusBelli] = useState<string>("");
  const [conflictFlagId, setConflictFlagId] = useState<string>(initialConflictFlagId ?? "");

  const [submitting, setSubmitting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setResult(null);

    if (!attacker.team_id || !defender.team_id) {
      setError("Attacker and defender teams are required.");
      return;
    }
    if (attacker.team_id === defender.team_id) {
      setError("Attacker and defender cannot be the same team.");
      return;
    }
    if (useAlly && !ally.team_id) {
      setError("Ally team_id is required when ally support is enabled.");
      return;
    }
    if (useAlly && ally.soldiers > 0 && ally.soldiers_committed === 0) {
      setError("Ally has soldiers available; minimum 1 must be committed (F9 fix — no symbolic-only support).");
      return;
    }

    setSubmitting(true);

    const body: Record<string, unknown> = {
      attacker: toParticipantPayload(attacker),
      defender: toParticipantPayload(defender),
      casus_belli: casusBelli || undefined,
      conflict_flag_id: conflictFlagId || undefined,
    };
    if (useAlly) {
      body.ally = {
        ...toParticipantPayload(ally),
        soldiers_committed: ally.soldiers_committed,
      };
    }

    try {
      const res = await fetch(`/api/games/${gameId}/battles/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(payload?.error ?? `Error ${res.status}`);
      } else {
        setResult(payload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setAttacker(emptyParticipant());
    setDefender(emptyParticipant());
    setUseAlly(false);
    setAlly(emptyAlly());
    setCasusBelli("");
    setConflictFlagId(initialConflictFlagId ?? "");
    setResult(null);
    setError(null);
  }

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 10,
        background: "#fff",
        border: "1px solid #e5dfd2",
        maxWidth: 760,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "1.2rem" }}>⚔️</span>
        <div style={{ fontSize: "1rem", fontWeight: 700 }}>Resolve Battle</div>
        <div style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#777" }}>
          POST /api/games/{gameId.slice(0, 8)}…/battles/resolve
        </div>
      </div>

      <ParticipantRow
        label="Attacker"
        state={attacker}
        onChange={setAttacker}
        teams={teams}
        excludeTeamId={defender.team_id}
      />
      <ParticipantRow
        label="Defender"
        state={defender}
        onChange={setDefender}
        teams={teams}
        excludeTeamId={attacker.team_id}
      />

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          marginTop: "0.5rem",
          fontSize: "0.85rem",
        }}
      >
        <input type="checkbox" checked={useAlly} onChange={(e) => setUseAlly(e.target.checked)} />
        Ally supports defender (alliance combat support)
      </label>
      {useAlly ? (
        <>
          <ParticipantRow
            label="Ally (defender's side)"
            state={ally}
            onChange={(next) => setAlly({ ...ally, ...next, soldiers_committed: ally.soldiers_committed })}
            teams={teams}
            excludeTeamId={attacker.team_id}
          />
          <div style={{ marginLeft: "1.5rem", marginBottom: "0.5rem", fontSize: "0.8rem" }}>
            Soldiers committed:{" "}
            <input
              type="number"
              min={0}
              max={ally.soldiers}
              value={ally.soldiers_committed}
              onChange={(e) =>
                setAlly({ ...ally, soldiers_committed: Math.max(0, parseInt(e.target.value || "0", 10)) })
              }
              style={{ width: 60, padding: "0.15rem" }}
            />
            {" "}
            <span style={{ color: "#666" }}>(must be ≥1 if ally has soldiers)</span>
          </div>
        </>
      ) : null}

      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", marginTop: "0.5rem" }}>
        Casus belli (optional — for audit/epilogue)
        <textarea
          value={casusBelli}
          onChange={(e) => setCasusBelli(e.target.value)}
          rows={2}
          style={{ padding: "0.3rem", borderRadius: 4, border: "1px solid #ddd6c3", fontFamily: "inherit" }}
          placeholder="The attacker's stated reason for going to war"
        />
      </label>

      <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem", marginTop: "0.5rem" }}>
        Conflict flag ID (optional — link to existing epoch_conflict_flags row)
        <input
          value={conflictFlagId}
          onChange={(e) => setConflictFlagId(e.target.value)}
          style={{ padding: "0.3rem", borderRadius: 4, border: "1px solid #ddd6c3" }}
          placeholder="UUID"
        />
      </label>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: 6,
            border: "none",
            background: "#9c2a2a",
            color: "#fff",
            fontWeight: 600,
            cursor: submitting ? "wait" : "pointer",
          }}
        >
          {submitting ? "Resolving…" : "Resolve Battle"}
        </button>
        <button
          type="button"
          onClick={reset}
          style={{ padding: "0.5rem 0.9rem", borderRadius: 6, border: "1px solid #ddd6c3", background: "#fff" }}
        >
          Reset
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: "0.75rem", padding: "0.5rem", borderRadius: 6, background: "#fee", color: "#900" }}>
          {error}
        </div>
      ) : null}

      {result ? (
        <pre
          style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            borderRadius: 6,
            background: "#0d0d16",
            color: "#a8dadc",
            fontSize: "0.75rem",
            overflow: "auto",
            maxHeight: 400,
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

function toParticipantPayload(p: ParticipantFormState) {
  return {
    team_id: p.team_id,
    soldiers: p.soldiers,
    barracks: p.barracks,
    walls: p.walls,
    d20_roll: p.d20_roll ? parseInt(p.d20_roll, 10) : undefined,
    justification_multiplier: p.justification_multiplier,
  };
}

function ParticipantRow({
  label,
  state,
  onChange,
  teams,
  excludeTeamId,
}: {
  label: string;
  state: ParticipantFormState;
  onChange: (next: ParticipantFormState) => void;
  teams: TeamRef[];
  excludeTeamId?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        alignItems: "center",
        padding: "0.5rem",
        borderRadius: 6,
        background: "#faf7ef",
        marginTop: "0.4rem",
        fontSize: "0.85rem",
      }}
    >
      <span style={{ fontWeight: 600, minWidth: 80 }}>{label}:</span>
      <select
        value={state.team_id}
        onChange={(e) => onChange({ ...state, team_id: e.target.value })}
        style={{ padding: "0.25rem", borderRadius: 4, border: "1px solid #ddd6c3" }}
      >
        <option value="">— choose —</option>
        {teams
          .filter((t) => t.id !== excludeTeamId)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.civilization_name || t.name}
            </option>
          ))}
      </select>
      <label>
        Soldiers:{" "}
        <input
          type="number"
          min={0}
          value={state.soldiers}
          onChange={(e) => onChange({ ...state, soldiers: Math.max(0, parseInt(e.target.value || "0", 10)) })}
          style={{ width: 56, padding: "0.15rem" }}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={state.barracks}
          onChange={(e) => onChange({ ...state, barracks: e.target.checked })}
        />{" "}
        Barracks
      </label>
      <label>
        <input
          type="checkbox"
          checked={state.walls}
          onChange={(e) => onChange({ ...state, walls: e.target.checked })}
        />{" "}
        Walls
      </label>
      <label>
        d20 (blank = auto):{" "}
        <input
          type="number"
          min={1}
          max={20}
          value={state.d20_roll}
          onChange={(e) => onChange({ ...state, d20_roll: e.target.value })}
          style={{ width: 56, padding: "0.15rem" }}
        />
      </label>
      <label>
        Justify×:{" "}
        <input
          type="number"
          step={0.1}
          min={0.5}
          max={2.0}
          value={state.justification_multiplier}
          onChange={(e) =>
            onChange({ ...state, justification_multiplier: Math.max(0.5, Math.min(2.0, parseFloat(e.target.value) || 1.0)) })
          }
          style={{ width: 60, padding: "0.15rem" }}
        />
      </label>
    </div>
  );
}
