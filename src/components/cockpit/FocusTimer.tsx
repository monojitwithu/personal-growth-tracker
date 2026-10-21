import { Pause, Play, RotateCcw, Square, Timer } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { TIMER_PRESETS, useStopwatch, type TimerMode } from '../../hooks/useStopwatch';
import { cn } from '../../lib/cn';
import { formatClock } from '../../lib/date';
import { Button } from '../ui/Button';
import { Card, CardHeader } from '../ui/Card';
import { ProgressRing } from '../ui/Progress';
import { useToast } from '../ui/Toast';

interface FocusTimerProps {
  /** Receives the captured session length in hours (2-decimal precision). */
  onCapture: (hours: number) => void;
}

const MIN_CAPTURE_MS = 30_000;
const msToHours = (ms: number) => Math.max(0.01, Math.round((ms / 3_600_000) * 100) / 100);

/** Short two-tone chime via WebAudio — no audio asset needed, works offline. */
function playChime() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.65);
    });
    window.setTimeout(() => void ctx.close(), 1200);
  } catch {
    /* audio is best-effort */
  }
}

export function FocusTimer({ onCapture }: FocusTimerProps) {
  const { toast } = useToast();
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;

  const sw = useStopwatch({
    onComplete: (ms) => {
      playChime();
      navigator.vibrate?.([120, 60, 120]);
      onCaptureRef.current(msToHours(ms));
      toast({
        tone: 'success',
        title: 'Focus block complete',
        description: `${msToHours(ms)}h added to today's duration. Take a 5-minute break.`,
      });
    },
  });

  // Reflect the running clock in the tab title so it's visible from other tabs.
  const baseTitle = useRef(document.title);
  const display = sw.remainingMs !== null ? sw.remainingMs : sw.elapsedMs;
  useEffect(() => {
    document.title = sw.isRunning ? `⏱ ${formatClock(display)} · FullStack Ascent` : baseTitle.current;
  }, [sw.isRunning, display]);
  useEffect(() => {
    const original = baseTitle.current;
    return () => {
      document.title = original;
    };
  }, []);

  function handleStopAndLog() {
    const ms = sw.stop();
    if (ms < MIN_CAPTURE_MS) {
      toast({ tone: 'info', title: 'Session too short to log', description: 'Capture at least 30 seconds of focus time.' });
      return;
    }
    const hours = msToHours(ms);
    onCaptureRef.current(hours);
    toast({ tone: 'success', title: `Captured ${hours}h`, description: 'Duration filled in the log form below.' });
  }

  const ringValue =
    sw.progress !== null ? sw.progress : (sw.elapsedMs % 3_600_000) / 3_600_000; // stopwatch: one lap per hour
  const hasTime = sw.elapsedMs > 0;

  return (
    <Card className="p-5" glow="tech" aria-labelledby="focus-timer-title">
      <CardHeader
        icon={Timer}
        title="Focus Timer"
        titleId="focus-timer-title"
        description="Stopping auto-fills your session duration"
        action={
          sw.isRunning ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-growth-500/15 px-2 py-0.5 text-[11px] font-medium text-growth-300">
              <span className="h-1.5 w-1.5 animate-pulse-ring rounded-full bg-growth-400" aria-hidden="true" />
              Live
            </span>
          ) : null
        }
      />

      <div role="radiogroup" aria-label="Timer mode" className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-ink-950/60 p-1 ring-1 ring-white/[0.06]">
        {(Object.keys(TIMER_PRESETS) as TimerMode[]).map((m) => {
          const active = sw.mode === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={active}
              id={`timer-mode-${m}`}
              disabled={sw.isRunning && !active}
              onClick={() => sw.setMode(m)}
              className={cn(
                'rounded-lg py-1.5 text-xs font-medium transition-all',
                active ? 'bg-white/[0.09] text-white shadow-sm' : 'text-slate-400 hover:text-slate-200',
                'disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              {TIMER_PRESETS[m].label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex justify-center">
        <ProgressRing
          value={ringValue}
          size={188}
          stroke={9}
          gradientId="timer-ring"
          label={sw.progress !== null ? 'Pomodoro progress' : 'Stopwatch progress within the current hour'}
          from={sw.isFinished ? 'var(--color-growth-400)' : 'var(--color-tech-400)'}
          to="var(--color-growth-400)"
        >
          <div>
            <p
              className={cn(
                'font-mono text-4xl font-semibold tracking-tight tabular-nums transition-colors',
                sw.isRunning ? 'text-white' : 'text-slate-200',
              )}
              aria-live="off"
            >
              {formatClock(display)}
            </p>
            <p className="mt-1 text-[11px] tracking-wider text-slate-400 uppercase">
              {sw.isFinished
                ? 'Complete'
                : sw.remainingMs !== null
                  ? 'remaining'
                  : 'elapsed'}
            </p>
            {hasTime && (
              <p className="mt-1.5 font-mono text-[11px] text-tech-300">≈ {msToHours(sw.elapsedMs)}h</p>
            )}
          </div>
        </ProgressRing>
      </div>

      <div className="mt-5 grid grid-cols-[auto_1fr_auto] gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11"
          onClick={sw.reset}
          disabled={!hasTime}
          aria-label="Reset timer"
          id="timer-reset"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        {sw.isRunning ? (
          <Button variant="secondary" size="lg" className="h-11" onClick={sw.pause} id="timer-pause" leftIcon={<Pause className="h-4 w-4" aria-hidden="true" />}>
            Pause
          </Button>
        ) : (
          <Button variant="primary" size="lg" className="h-11" onClick={sw.start} id="timer-start" leftIcon={<Play className="h-4 w-4" aria-hidden="true" />}>
            {hasTime && !sw.isFinished ? 'Resume' : 'Start focus'}
          </Button>
        )}
        <Button
          variant="success"
          size="icon"
          className="h-11 w-11"
          onClick={handleStopAndLog}
          disabled={!hasTime}
          aria-label="Stop timer and use duration"
          title="Stop & use duration"
          id="timer-stop"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
      </div>
    </Card>
  );
}
