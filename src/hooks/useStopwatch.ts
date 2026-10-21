import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type TimerMode = 'pomodoro25' | 'pomodoro50' | 'stopwatch';

export const TIMER_PRESETS: Record<TimerMode, { label: string; targetMs: number | null }> = {
  pomodoro25: { label: '25m', targetMs: 25 * 60_000 },
  pomodoro50: { label: '50m', targetMs: 50 * 60_000 },
  stopwatch: { label: 'Stopwatch', targetMs: null },
};

interface PersistedTimer {
  mode: TimerMode;
  /** Epoch ms when the current running segment began; null when paused/idle. */
  startedAt: number | null;
  /** Elapsed ms from previous (paused) segments. */
  accumulatedMs: number;
}

const IDLE: PersistedTimer = { mode: 'pomodoro25', startedAt: null, accumulatedMs: 0 };

function isPersistedTimer(v: unknown): v is PersistedTimer {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    (t.mode === 'pomodoro25' || t.mode === 'pomodoro50' || t.mode === 'stopwatch') &&
    (t.startedAt === null || typeof t.startedAt === 'number') &&
    typeof t.accumulatedMs === 'number'
  );
}

interface Options {
  onComplete?: (elapsedMs: number) => void;
}

/**
 * Wall-clock based focus timer. Elapsed time is derived from `Date.now()` rather than
 * counting ticks, so it stays accurate in throttled background tabs, and its state is
 * persisted so a reload / app relaunch doesn't lose a running session.
 */
export function useStopwatch({ onComplete }: Options = {}) {
  const [timer, setTimer] = useLocalStorage<PersistedTimer>('fullstack_ascent_timer', IDLE, {
    validate: isPersistedTimer,
  });
  const [now, setNow] = useState(() => Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const isRunning = timer.startedAt !== null;
  const targetMs = TIMER_PRESETS[timer.mode].targetMs;
  const rawElapsed = timer.accumulatedMs + (timer.startedAt !== null ? Math.max(0, now - timer.startedAt) : 0);
  const elapsedMs = targetMs !== null ? Math.min(rawElapsed, targetMs) : rawElapsed;
  const remainingMs = targetMs !== null ? Math.max(0, targetMs - elapsedMs) : null;
  const progress = targetMs !== null ? elapsedMs / targetMs : null;
  const isFinished = targetMs !== null && elapsedMs >= targetMs;

  useEffect(() => {
    if (!isRunning) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isRunning]);

  // Auto-complete pomodoro countdowns.
  useEffect(() => {
    if (isRunning && targetMs !== null && rawElapsed >= targetMs) {
      setTimer((t) => ({ ...t, startedAt: null, accumulatedMs: targetMs }));
      onCompleteRef.current?.(targetMs);
    }
  }, [isRunning, rawElapsed, targetMs, setTimer]);

  const start = useCallback(() => {
    setTimer((t) => {
      if (t.startedAt !== null) return t;
      const target = TIMER_PRESETS[t.mode].targetMs;
      // Restarting a finished pomodoro begins a fresh cycle.
      const acc = target !== null && t.accumulatedMs >= target ? 0 : t.accumulatedMs;
      return { ...t, accumulatedMs: acc, startedAt: Date.now() };
    });
    setNow(Date.now());
  }, [setTimer]);

  const pause = useCallback(() => {
    setTimer((t) =>
      t.startedAt === null ? t : { ...t, startedAt: null, accumulatedMs: t.accumulatedMs + (Date.now() - t.startedAt) },
    );
  }, [setTimer]);

  const reset = useCallback(() => {
    setTimer((t) => ({ ...t, startedAt: null, accumulatedMs: 0 }));
  }, [setTimer]);

  /** Stops the timer, resets it, and returns the captured elapsed time in ms. */
  const stop = useCallback((): number => {
    const t = timer;
    const target = TIMER_PRESETS[t.mode].targetMs;
    let total = t.accumulatedMs + (t.startedAt !== null ? Date.now() - t.startedAt : 0);
    if (target !== null) total = Math.min(total, target);
    setTimer({ ...t, startedAt: null, accumulatedMs: 0 });
    return total;
  }, [timer, setTimer]);

  const setMode = useCallback(
    (mode: TimerMode) => {
      setTimer((t) => (t.startedAt !== null ? t : { mode, startedAt: null, accumulatedMs: 0 }));
    },
    [setTimer],
  );

  return {
    mode: timer.mode,
    setMode,
    isRunning,
    isFinished,
    elapsedMs,
    remainingMs,
    targetMs,
    progress,
    start,
    pause,
    stop,
    reset,
  };
}
