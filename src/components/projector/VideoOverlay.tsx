"use client";

// ============================================
// VideoOverlay — Projector video player
// Decision 55: Plays pre-rendered HeyGen clips
// ============================================

import { useState, useRef, useEffect } from "react";

interface VideoOverlayProps {
  videoUrl: string | null;
  onComplete: () => void;
  onSkip: () => void;
  isTeacher: boolean;
}

export default function VideoOverlay({
  videoUrl,
  onComplete,
  onSkip,
  isTeacher,
}: VideoOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.play().catch(() => {
        // autoplay may be blocked — user interaction needed
      });
      setIsPlaying(true);
    }
  }, [videoUrl]);

  if (!videoUrl) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onEnded={() => {
          setIsPlaying(false);
          onComplete();
        }}
        onError={() => {
          setIsPlaying(false);
          onComplete();
        }}
        playsInline
        autoPlay
      />

      {/* Skip button (teacher only) */}
      {isTeacher && (
        <button
          type="button"
          onClick={onSkip}
          className="absolute top-4 right-4 rounded-lg bg-gray-800/80 px-4 py-2 text-sm text-white hover:bg-gray-700 transition-all backdrop-blur-sm"
        >
          ⏭️ Skip
        </button>
      )}

      {/* Loading indicator if not playing yet */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-white text-lg animate-pulse">Loading video...</div>
        </div>
      )}
    </div>
  );
}
