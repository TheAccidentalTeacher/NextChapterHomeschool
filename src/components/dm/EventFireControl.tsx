"use client";

// ============================================
// EventFireControl — DM panel component
// Decision 33: DM can select event type, target
// team(s), and manually fire events. Also supports
// auto-rolling d20 for all teams at once.
// ============================================

import { useState } from "react";
import { EVENT_DECK, getSeverityDisplay, type EventDefinition } from "@/lib/game/event-deck";

interface TeamInfo {
  id: string;
  name: string;
  civilizationName: string | null;
}

interface EventFireControlProps {
  teams: TeamInfo[];
  gameId: string;
  onFireEvent: (eventId: string, teamIds: string[]) => void;
  onAutoRollAll: () => void;
}

export default function EventFireControl({
  teams,
  gameId,
  onFireEvent,
  onAutoRollAll,
}: EventFireControlProps) {
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [showEventList, setShowEventList] = useState(false);

  const selectedEvent = EVENT_DECK.find((e) => e.id === selectedEventId);

  function handleToggleTeam(teamId: string) {
    setSelectedTeamIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((id) => id !== teamId)
        : [...prev, teamId]
    );
  }

  function handleSelectAllTeams() {
    setSelectedTeamIds(teams.map((t) => t.id));
  }

  function handleFire() {
    if (!selectedEventId || selectedTeamIds.length === 0) return;
    onFireEvent(selectedEventId, selectedTeamIds);
    setSelectedTeamIds([]);
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-900/95 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          🎲 Event Fire Control
        </h3>
        <button
          type="button"
          onClick={onAutoRollAll}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-500"
        >
          🎲 Auto-Roll All Teams
        </button>
      </div>

      {/* Event Selector */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">Select Event</label>
        <button
          type="button"
          onClick={() => setShowEventList(!showEventList)}
          className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-left text-white hover:border-gray-500 transition-colors"
        >
          {selectedEvent
            ? `${selectedEvent.emoji} ${selectedEvent.name}`
            : "Choose an event..."}
          <span className="float-right text-gray-500">▼</span>
        </button>

        {showEventList && (
          <div className="mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-600 bg-gray-800">
            {EVENT_DECK.map((event) => {
              const sev = getSeverityDisplay(event.severity);
              return (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => {
                    setSelectedEventId(event.id);
                    setShowEventList(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-700 transition-colors flex items-center justify-between ${
                    selectedEventId === event.id ? "bg-gray-700" : ""
                  }`}
                >
                  <span>
                    {event.emoji} {event.name}
                    {event.coastalOnly && (
                      <span className="text-xs text-blue-400 ml-1">(coastal)</span>
                    )}
                  </span>
                  <span className={`text-xs ${sev.color}`}>{sev.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Event Preview */}
      {selectedEvent && (
        <div className={`rounded-lg border border-gray-700 p-3 text-xs ${getSeverityDisplay(selectedEvent.severity).bgColor}`}>
          <div className="font-medium text-white mb-1">
            {selectedEvent.emoji} {selectedEvent.name}
          </div>
          <div className="text-gray-400 italic mb-1">{selectedEvent.flavorText}</div>
          <div className="text-gray-300">{selectedEvent.description}</div>
          {selectedEvent.mitigations.length > 0 && (
            <div className="text-gray-500 mt-1">
              Mitigated by: {selectedEvent.mitigations.join(", ")}
            </div>
          )}
        </div>
      )}

      {/* Team Selection */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-gray-400">Target Team(s)</label>
          <button
            type="button"
            onClick={handleSelectAllTeams}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Select All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {teams.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => handleToggleTeam(team.id)}
              className={`rounded-lg border px-2 py-1.5 text-xs text-left transition-all ${
                selectedTeamIds.includes(team.id)
                  ? "border-blue-500 bg-blue-900/20 text-white"
                  : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
              }`}
            >
              {selectedTeamIds.includes(team.id) ? "✓ " : ""}
              {team.civilizationName || team.name}
            </button>
          ))}
        </div>
      </div>

      {/* Fire Button */}
      <button
        type="button"
        onClick={handleFire}
        disabled={!selectedEventId || selectedTeamIds.length === 0}
        className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold transition-all ${
          selectedEventId && selectedTeamIds.length > 0
            ? "bg-red-600 text-white hover:bg-red-500 active:bg-red-700"
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
        }`}
      >
        🔥 Fire Event at {selectedTeamIds.length} Team{selectedTeamIds.length !== 1 ? "s" : ""}
      </button>
    </div>
  );
}
