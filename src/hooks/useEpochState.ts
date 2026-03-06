// ============================================
// useEpochState — Real-time epoch state subscription hook
// Decision 79: Epoch state machine (login→rounds→resolve→exit)
//
// Subscribes to game state changes via Supabase Realtime.
// Returns the current epoch, step, timer remaining, and
// pause state. Used by both StudentDashboard and Projector
// to stay in sync with the DM's epoch progression.
//
// Features:
//   - Initial fetch from /api/games/[id]/epoch/state
//   - Supabase Realtime subscription on games table
//   - Auto countdown timer based on step duration
//   - Grade-aware timer presets (6th vs 7/8th)
// ============================================

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { EpochStep } from "@/lib/game/epoch-machine";
import { getStepDuration, TIMER_PRESETS, STEP_LABELS } from "@/lib/game/epoch-machine";

interface EpochState {
  gameId: string | null;
  epoch: number;
  step: EpochStep;
  stepLabel: string;
  isPaused: boolean;
  timerRemaining: number; // seconds
  isLoading: boolean;
}

interface UseEpochStateOptions {
  gameId: string | null;
  grade?: "6th" | "7_8th";
}

/**
 * React hook that subscribes to epoch/round state changes via Supabase Realtime.
 * Provides current epoch, step, timer, and pause state.
 */
export function useEpochState({ gameId, grade = "6th" }: UseEpochStateOptions): EpochState {
  const [state, setState] = useState<EpochState>({
    gameId,
    epoch: 1,
    step: "login",
    stepLabel: STEP_LABELS.login,
    isPaused: false,
    timerRemaining: 0,
    isLoading: true,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch initial state
  const fetchState = useCallback(async () => {
    if (!gameId) return;

    try {
      const res = await fetch(`/api/games/${gameId}/epoch/state`);
      if (!res.ok) return;
      const data = await res.json();

      const step = (data.current_round ?? "login") as EpochStep;
      const config = TIMER_PRESETS[grade];
      const duration = getStepDuration(step, config);

      setState({
        gameId,
        epoch: data.current_epoch ?? 1,
        step,
        stepLabel: STEP_LABELS[step] ?? step,
        isPaused: data.epoch_phase === "resolving",
        timerRemaining: duration,
        isLoading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [gameId, grade]);

  // Subscribe to Realtime changes on games table
  useEffect(() => {
    if (!gameId) return;

    fetchState();

    const channel = supabase
      .channel(`game-epoch-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          const step = (data.current_round ?? "login") as EpochStep;
          const config = TIMER_PRESETS[grade];
          const duration = getStepDuration(step, config);

          setState({
            gameId,
            epoch: (data.current_epoch as number) ?? 1,
            step,
            stepLabel: STEP_LABELS[step] ?? step,
            isPaused: data.epoch_phase === "resolving",
            timerRemaining: duration,
            isLoading: false,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, grade, fetchState]);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (state.isPaused || state.timerRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        timerRemaining: Math.max(0, prev.timerRemaining - 1),
      }));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isPaused, state.step]);

  return state;
}
