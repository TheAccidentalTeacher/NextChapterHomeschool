"use client";

import { useState, useEffect } from "react";

interface AnnouncementOverlayProps {
  text: string;
  onDismiss: () => void;
  durationMs?: number;
}

export default function AnnouncementOverlay({
  text,
  onDismiss,
  durationMs = 8000,
}: AnnouncementOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="mx-8 max-w-2xl rounded-2xl border border-amber-700 bg-stone-900 p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl">📢</div>
        <p className="text-2xl font-bold leading-relaxed text-stone-200">
          {text}
        </p>
      </div>
    </div>
  );
}
