// ============================================
// IntelDropModal — Student private message viewer
// Polls for DM "intel drops" and shows unread
// messages one at a time with dismiss button.
// Decision 60: DM intel drops for hidden info.
// ============================================

"use client";

import { useState, useEffect } from "react";

interface PrivateMessage {
  id: string;
  message: string;
  created_at: string;
}

interface IntelDropModalProps {
  gameId: string;
  teamId: string;
}

export default function IntelDropModal({ gameId, teamId }: IntelDropModalProps) {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [unread, setUnread] = useState<PrivateMessage | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `/api/games/${gameId}/messages/private?team_id=${teamId}`
        );
        if (res.ok) {
          const data = await res.json();
          const msgs: PrivateMessage[] = data.messages ?? [];
          setMessages(msgs);
          const newMsg = msgs.find((m) => !dismissed.has(m.id));
          if (newMsg) setUnread(newMsg);
        }
      } catch {
        // ignore
      }
    }
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, teamId]);

  if (!unread) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md transform animate-bounce-in rounded-2xl border border-indigo-700 bg-stone-900 p-6 shadow-2xl">
        <div className="mb-3 text-center">
          <span className="text-4xl">📨</span>
          <h2 className="mt-2 text-lg font-bold text-indigo-400">
            Intel Drop
          </h2>
          <p className="text-xs text-stone-500">
            A message from the Dungeon Master
          </p>
        </div>

        <div className="rounded-lg border border-indigo-900 bg-stone-950 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-300">
            {unread.message}
          </p>
        </div>

        <button
          onClick={() => {
            setDismissed((prev) => new Set(prev).add(unread.id));
            setUnread(null);
          }}
          className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Acknowledged
        </button>
      </div>
    </div>
  );
}
