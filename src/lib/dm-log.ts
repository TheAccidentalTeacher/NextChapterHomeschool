// ============================================
// DM Event Logger — module-level singleton
// Captures all DM actions and student activity.
// Logs to both in-app panel and browser console.
// ============================================

export type LogLevel = "info" | "ok" | "warn" | "error";

export interface LogEntry {
  id: number;
  ts: string;
  level: LogLevel;
  source: string;
  message: string;
  detail?: string;
}

let counter = 0;
const MAX_ENTRIES = 500;
const entries: LogEntry[] = [];
const subscribers: Array<(entries: LogEntry[]) => void> = [];

function notify() {
  const snapshot = [...entries];
  for (const sub of subscribers) sub(snapshot);
}

export function dmLog(
  level: LogLevel,
  source: string,
  message: string,
  detail?: unknown
) {
  const now = new Date();
  const ts = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const entry: LogEntry = {
    id: ++counter,
    ts,
    level,
    source,
    message,
    detail:
      detail !== undefined
        ? typeof detail === "string"
          ? detail
          : JSON.stringify(detail, null, 2)
        : undefined,
  };

  entries.unshift(entry); // newest first
  if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);

  // Mirror to browser console with clear prefix so F12 always works
  const prefix = `%c[ClassCiv DM] ${ts} [${source}]`;
  const colors: Record<LogLevel, string> = {
    info: "color:#9ca3af",
    ok: "color:#4ade80",
    warn: "color:#fbbf24;font-weight:bold",
    error: "color:#f87171;font-weight:bold",
  };
  if (level === "error") {
    console.error(prefix, colors[level], message, detail ?? "");
  } else if (level === "warn") {
    console.warn(prefix, colors[level], message, detail ?? "");
  } else {
    console.log(prefix, colors[level], message, detail ?? "");
  }

  notify();
}

export function subscribeToDMLog(
  cb: (entries: LogEntry[]) => void
): () => void {
  subscribers.push(cb);
  cb([...entries]); // send current snapshot immediately
  return () => {
    const idx = subscribers.indexOf(cb);
    if (idx > -1) subscribers.splice(idx, 1);
  };
}

export function clearDMLog() {
  entries.splice(0);
  notify();
}
