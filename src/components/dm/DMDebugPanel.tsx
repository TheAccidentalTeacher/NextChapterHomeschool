"use client";

import { useState, useEffect, useRef } from "react";
import { subscribeToDMLog, clearDMLog, type LogEntry, type LogLevel } from "@/lib/dm-log";

const LEVEL_TEXT: Record<LogLevel, string> = {
  info: "text-stone-400",
  ok: "text-green-400",
  warn: "text-amber-300",
  error: "text-red-400",
};

const LEVEL_BG: Record<LogLevel, string> = {
  info: "",
  ok: "bg-green-900/10",
  warn: "bg-amber-900/20",
  error: "bg-red-900/25",
};

const LEVEL_BADGE: Record<LogLevel, string> = {
  info: "bg-stone-700 text-stone-400",
  ok: "bg-green-900/50 text-green-400",
  warn: "bg-amber-900/60 text-amber-300",
  error: "bg-red-900/60 text-red-400",
};

export default function DMDebugPanel() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeToDMLog((e) => {
      setEntries(e);
    });
  }, []);

  const filtered = entries.filter((e) => {
    if (levelFilter !== "all" && e.level !== levelFilter) return false;
    if (filter) {
      const q = filter.toLowerCase();
      return (
        e.source.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        (e.detail?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="text"
          placeholder="Filter by source or message…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 min-w-0 rounded bg-stone-800 px-2 py-1 text-xs text-stone-300 outline-none placeholder:text-stone-600"
        />
        {(["all", "ok", "warn", "error", "info"] as const).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setLevelFilter(lvl)}
            className={`rounded px-2 py-0.5 text-xs transition ${
              levelFilter === lvl
                ? "bg-stone-600 text-white"
                : "bg-stone-900 text-stone-500 hover:text-stone-300"
            }`}
          >
            {lvl}
          </button>
        ))}
        <button
          onClick={clearDMLog}
          className="rounded bg-stone-900 px-2 py-0.5 text-xs text-stone-600 hover:text-red-400 transition"
        >
          🗑
        </button>
      </div>

      {/* Summary bar */}
      <div className="flex gap-3 text-[11px] text-stone-600">
        <span>{entries.length} total</span>
        <span className="text-red-400">{entries.filter((e) => e.level === "error").length} errors</span>
        <span className="text-amber-400">{entries.filter((e) => e.level === "warn").length} warnings</span>
        <span className="text-green-400">{entries.filter((e) => e.level === "ok").length} ok</span>
        <span className="ml-auto text-stone-700">also in F12 console: [ClassCiv DM]</span>
      </div>

      {/* Log entries */}
      <div
        ref={scrollRef}
        className="h-[520px] overflow-y-auto rounded border border-stone-800 bg-stone-950 p-1.5 space-y-0.5"
      >
        {filtered.length === 0 && (
          <p className="p-2 text-xs text-stone-600 italic">
            {entries.length === 0 ? "No events yet — interactions will appear here." : "No entries match filter."}
          </p>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className={`rounded px-2 py-0.5 cursor-pointer ${LEVEL_BG[entry.level]} ${entry.detail ? "hover:bg-stone-800/50" : ""}`}
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          >
            <div className="flex items-start gap-1.5 font-mono text-[11px]">
              <span className="shrink-0 text-stone-600">{entry.ts}</span>
              <span className={`shrink-0 rounded px-1 py-px text-[10px] font-bold uppercase ${LEVEL_BADGE[entry.level]}`}>
                {entry.level}
              </span>
              <span className="shrink-0 text-sky-500">[{entry.source}]</span>
              <span className={`flex-1 ${LEVEL_TEXT[entry.level]}`}>{entry.message}</span>
              {entry.detail && (
                <span className="shrink-0 text-stone-600 text-[10px]">
                  {expandedId === entry.id ? "▲" : "▼"}
                </span>
              )}
            </div>
            {expandedId === entry.id && entry.detail && (
              <pre className="mt-1 overflow-x-auto rounded bg-stone-900 p-2 text-[10px] text-stone-400 whitespace-pre-wrap">
                {entry.detail}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
