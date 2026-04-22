// ============================================================
// DiplomacyPanel — Realms v2 diplomatic action UI
// ============================================================
// Per Mira C2: the panel is visible + grayed-locked pre-E4, showing the
// seven action types so children anticipate diplomacy. Unlocks E4+ for
// alliance + ultimatum actions, E6+ for war + peace + vassalage actions.
// ============================================================

"use client";

import { useState } from "react";

interface DiplomacyPanelProps {
  currentEpoch: number;
  gameId: string;
  teamId: string;
  otherTeams: Array<{ id: string; name: string; civilization_name: string | null }>;
  activeAlliances: Array<{ id: string; partner_team_id: string; partner_civ_name: string }>;
  isVassal: boolean;
}

const ACTIONS = [
  { key: "propose_alliance", label: "Propose Alliance", emoji: "🤝", unlocksAt: 4, needsTreatyText: true },
  { key: "break_alliance", label: "Break Alliance", emoji: "💔", unlocksAt: 4, needsTreatyText: true, activeAllianceOnly: true },
  { key: "propose_trade", label: "Propose Trade Agreement", emoji: "🧭", unlocksAt: 2, needsTreatyText: false },
  { key: "issue_ultimatum", label: "Issue Ultimatum", emoji: "⚠️", unlocksAt: 4, needsTreatyText: true },
  { key: "declare_war", label: "Declare War", emoji: "⚔️", unlocksAt: 6, needsTreatyText: true },
  { key: "sue_for_peace", label: "Sue for Peace", emoji: "🕊️", unlocksAt: 6, needsTreatyText: false },
  { key: "propose_vassalage", label: "Propose Vassalage", emoji: "👑", unlocksAt: 6, needsTreatyText: false },
] as const;

type ActionKey = (typeof ACTIONS)[number]["key"];

export default function DiplomacyPanel(props: DiplomacyPanelProps) {
  const { currentEpoch, gameId, teamId, otherTeams, activeAlliances, isVassal } = props;
  const [selectedAction, setSelectedAction] = useState<ActionKey | null>(null);
  const [targetTeamId, setTargetTeamId] = useState<string>("");
  const [treatyText, setTreatyText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const allLocked = currentEpoch < 4;
  const selectedMeta = ACTIONS.find((a) => a.key === selectedAction) ?? null;

  async function submitAction() {
    if (!selectedMeta) return;
    if (!targetTeamId) {
      setMessage("Choose a target civilization first.");
      return;
    }
    if (selectedMeta.needsTreatyText && treatyText.trim().length < 10) {
      setMessage("At least 10 characters of reasoning / treaty text required.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let url = "";
      let body: Record<string, unknown> = {};

      if (selectedAction === "propose_alliance") {
        url = `/api/games/${gameId}/alliances/propose`;
        body = { proposer_team_id: teamId, target_team_id: targetTeamId, treaty_text: treatyText };
      } else if (selectedAction === "break_alliance") {
        const alliance = activeAlliances.find((a) => a.partner_team_id === targetTeamId);
        if (!alliance) {
          setMessage("You do not have an active alliance with that civilization.");
          setSubmitting(false);
          return;
        }
        url = `/api/games/${gameId}/alliances/${alliance.id}/break`;
        body = { break_justification: treatyText };
      } else if (selectedAction === "issue_ultimatum") {
        url = `/api/games/${gameId}/ultimatums/issue`;
        body = {
          issuer_team_id: teamId,
          target_team_id: targetTeamId,
          demand_text: treatyText,
          threat_text: treatyText, // UI simplification — one text for both; backend accepts both fields
        };
      } else if (selectedAction === "propose_vassalage") {
        url = `/api/games/${gameId}/vassalage/propose`;
        body = {
          overlord_team_id: teamId,
          vassal_team_id: targetTeamId,
          tribute_percent: 20,
          terms_text: treatyText,
        };
      } else if (selectedAction === "declare_war" || selectedAction === "sue_for_peace" || selectedAction === "propose_trade") {
        // Route through generic /submissions for v1.5 — epoch gate already enforced server-side
        url = `/api/games/${gameId}/submissions`;
        body = {
          team_id: teamId,
          role: "diplomat",
          round_type: "DEFINE",
          option_selected: selectedAction,
          justification_text:
            treatyText.length >= 10
              ? treatyText
              : `${selectedMeta.label} against ${targetTeamId}. Reason to follow in classroom.`,
          free_text_action: JSON.stringify({ target_team_id: targetTeamId }),
        };
      } else {
        setMessage("Unknown action.");
        setSubmitting(false);
        return;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(payload?.error ?? `Error ${res.status}`);
      } else {
        setMessage("Submitted.");
        setSelectedAction(null);
        setTargetTeamId("");
        setTreatyText("");
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 10,
        background: "#fff",
        border: "1px solid #e5dfd2",
        opacity: allLocked ? 0.7 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "1.1rem" }}>🌐</span>
        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#1a1a1a" }}>Diplomacy</div>
        {allLocked ? (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.75rem",
              padding: "0.15rem 0.5rem",
              borderRadius: 6,
              background: "#eee",
              color: "#666",
            }}
          >
            Unlocks at Epoch 4 (you are in {currentEpoch})
          </span>
        ) : null}
      </div>

      {isVassal ? (
        <div
          style={{
            padding: "0.5rem",
            borderRadius: 6,
            background: "#f4f1e8",
            border: "1px solid #ddd6c3",
            fontSize: "0.85rem",
            color: "#5a4a2a",
            marginBottom: "0.75rem",
          }}
        >
          Your civilization is bound by vassalage. You may negotiate but cannot declare war independently.
        </div>
      ) : null}

      {/* Action tiles — show all 7 even when locked (preview anticipation per Mira C2) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "0.5rem",
          marginBottom: "0.75rem",
        }}
      >
        {ACTIONS.map((a) => {
          const locked = currentEpoch < a.unlocksAt;
          const selected = selectedAction === a.key;
          return (
            <button
              key={a.key}
              type="button"
              disabled={locked || submitting}
              onClick={() => setSelectedAction(a.key)}
              style={{
                padding: "0.5rem",
                borderRadius: 8,
                border: selected ? "2px solid #2a9d8f" : "1px solid #ddd6c3",
                background: selected ? "#e0f2ef" : locked ? "#f4f1e8" : "#fff",
                color: locked ? "#999" : "#1a1a1a",
                cursor: locked ? "not-allowed" : "pointer",
                fontSize: "0.85rem",
                textAlign: "left",
                opacity: locked ? 0.65 : 1,
              }}
              title={locked ? `Unlocks at Epoch ${a.unlocksAt}` : a.label}
            >
              <div style={{ fontSize: "1.1rem" }}>{a.emoji}</div>
              <div style={{ fontWeight: 600 }}>{a.label}</div>
              {locked ? (
                <div style={{ fontSize: "0.7rem", color: "#999" }}>
                  Unlocks E{a.unlocksAt}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Dialog for the selected action */}
      {selectedAction ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid #e5dfd2" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2c2c2c" }}>
            {selectedMeta?.emoji} {selectedMeta?.label}
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.8rem" }}>
            <span>Target civilization</span>
            <select
              value={targetTeamId}
              onChange={(e) => setTargetTeamId(e.target.value)}
              style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid #ddd6c3" }}
            >
              <option value="">— choose —</option>
              {otherTeams
                .filter((t) => t.id !== teamId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.civilization_name || t.name}
                  </option>
                ))}
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.2rem", fontSize: "0.8rem" }}>
            <span>
              {selectedMeta?.needsTreatyText ? "Treaty / reason (required, ≥10 chars)" : "Free-text context (optional)"}
            </span>
            <textarea
              value={treatyText}
              onChange={(e) => setTreatyText(e.target.value)}
              rows={3}
              style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid #ddd6c3", fontFamily: "inherit" }}
              placeholder="Your words matter — they will be seen on the projector and saved in the portfolio."
            />
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={submitAction}
              disabled={submitting}
              style={{
                padding: "0.5rem 0.9rem",
                borderRadius: 6,
                border: "none",
                background: "#2a9d8f",
                color: "#fff",
                fontWeight: 600,
                cursor: submitting ? "wait" : "pointer",
              }}
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedAction(null);
                setTargetTeamId("");
                setTreatyText("");
                setMessage(null);
              }}
              style={{ padding: "0.5rem 0.9rem", borderRadius: 6, border: "1px solid #ddd6c3", background: "#fff" }}
            >
              Cancel
            </button>
          </div>
          {message ? (
            <div style={{ fontSize: "0.8rem", color: message.startsWith("Submitted") ? "#2a9d8f" : "#c13e3e" }}>
              {message}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
