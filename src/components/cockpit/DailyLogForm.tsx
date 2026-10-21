import { CalendarDays, Clock, GitCommitHorizontal, NotebookPen, Rocket, Type } from 'lucide-react';
import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { cn } from '../../lib/cn';
import { MODE_META, TONE_CLASSES } from '../../lib/modes';
import { FOCUS_MODES, LOG_STATUSES } from '../../lib/persistence';
import type { FocusMode, LogStatus } from '../../types';
import { Button } from '../ui/Button';

export interface LogFormValues {
  taskTitle: string;
  mode: FocusMode;
  date: string;
  durationHours: string;
  outputArtifact: string;
  notesAndBlockers: string;
  status: LogStatus;
}

interface DailyLogFormProps {
  values: LogFormValues;
  onChange: (patch: Partial<LogFormValues>) => void;
  onSubmit: () => void;
  /** True briefly after the timer fills the duration, to highlight the field. */
  durationFlash: boolean;
  weekLabel: string;
  maxDate: string;
}

const QUICK_DURATIONS = [0.5, 1, 1.5, 2, 3];

const STATUS_STYLES: Record<LogStatus, string> = {
  Completed: 'has-[:checked]:bg-growth-500/15 has-[:checked]:text-growth-300 has-[:checked]:ring-growth-400/40',
  'In Progress': 'has-[:checked]:bg-tech-500/15 has-[:checked]:text-tech-300 has-[:checked]:ring-tech-400/40',
  'Rest Day': 'has-[:checked]:bg-slate-500/20 has-[:checked]:text-slate-200 has-[:checked]:ring-slate-400/40',
};

type Errors = Partial<Record<'taskTitle' | 'durationHours' | 'date', string>>;

export function validateLogForm(v: LogFormValues): Errors {
  const errors: Errors = {};
  const dur = Number(v.durationHours);
  if (v.status !== 'Rest Day' && !v.taskTitle.trim()) errors.taskTitle = 'Pick a task above or enter a title.';
  if (v.durationHours.trim() === '' || !Number.isFinite(dur) || dur < 0 || dur > 24) {
    errors.durationHours = 'Enter hours between 0 and 24.';
  } else if (v.status !== 'Rest Day' && dur === 0) {
    errors.durationHours = 'Log at least a few minutes of work.';
  }
  if (!v.date) errors.date = 'Choose a date.';
  return errors;
}

export function DailyLogForm({ values, onChange, onSubmit, durationFlash, weekLabel, maxDate }: DailyLogFormProps) {
  const uid = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const ids = {
    title: `${uid}-title`,
    date: `${uid}-date`,
    duration: `${uid}-duration`,
    artifact: `${uid}-artifact`,
    notes: `${uid}-notes`,
  };

  function update(patch: Partial<LogFormValues>) {
    onChange(patch);
    if (submitted) setErrors(validateLogForm({ ...values, ...patch }));
  }

  function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setSubmitted(true);
    const errs = validateLogForm(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      const first = errs.taskTitle ? ids.title : errs.durationHours ? ids.duration : ids.date;
      document.getElementById(first)?.focus();
      return;
    }
    onSubmit();
    setSubmitted(false);
    setErrors({});
  }

  function onTextareaKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
  }

  function setStatus(status: LogStatus) {
    if (status === 'Rest Day') {
      update({ status, mode: 'Buffer/Rest', taskTitle: values.taskTitle || 'Rest & Recovery Day', durationHours: values.durationHours || '0' });
    } else {
      update({ status, mode: values.mode === 'Buffer/Rest' ? 'Mode A' : values.mode });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5" aria-label="Daily log form">
      {/* Title */}
      <div>
        <label htmlFor={ids.title} className="field-label flex items-center gap-1.5">
          <Type className="h-3.5 w-3.5" aria-hidden="true" /> Task title
        </label>
        <input
          id={ids.title}
          type="text"
          value={values.taskTitle}
          onChange={(e) => update({ taskTitle: e.target.value })}
          placeholder="e.g. Fastify Production REST API Setup"
          className={cn('field', errors.taskTitle && 'border-rose-400/60')}
          aria-invalid={Boolean(errors.taskTitle)}
          aria-describedby={errors.taskTitle ? `${ids.title}-err` : undefined}
          autoComplete="off"
        />
        {errors.taskTitle && (
          <p id={`${ids.title}-err`} className="mt-1.5 text-xs text-rose-300">
            {errors.taskTitle}
          </p>
        )}
      </div>

      {/* Mode */}
      <fieldset>
        <legend className="field-label">Focus mode</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FOCUS_MODES.map((m) => {
            const meta = MODE_META[m];
            const tone = TONE_CLASSES[meta.tone];
            const Icon = meta.icon;
            const checked = values.mode === m;
            return (
              <label
                key={m}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tech-400',
                  checked ? cn(tone.bg, tone.text, tone.border) : 'border-white/[0.08] text-slate-400 hover:border-white/20 hover:text-slate-200',
                )}
              >
                <input
                  type="radio"
                  name={`${uid}-mode`}
                  value={m}
                  checked={checked}
                  onChange={() => update({ mode: m })}
                  className="sr-only"
                />
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="leading-tight">
                  {meta.label}
                  <span className="block text-[10px] font-normal opacity-80">{meta.tagline}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Date + Duration */}
      <div className="grid gap-4 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div>
          <label htmlFor={ids.date} className="field-label flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Date
          </label>
          <input
            id={ids.date}
            type="date"
            value={values.date}
            max={maxDate}
            onChange={(e) => update({ date: e.target.value })}
            className={cn('field font-mono', errors.date && 'border-rose-400/60')}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={`${ids.date}-hint`}
          />
          <p id={`${ids.date}-hint`} className="mt-1.5 text-[11px] text-slate-500">
            {errors.date ? <span className="text-rose-300">{errors.date}</span> : weekLabel}
          </p>
        </div>
        <div>
          <label htmlFor={ids.duration} className="field-label flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Duration (hours)
          </label>
          <div className="flex gap-2">
            <input
              id={ids.duration}
              type="number"
              inputMode="decimal"
              min={0}
              max={24}
              step="any"
              value={values.durationHours}
              onChange={(e) => update({ durationHours: e.target.value })}
              placeholder="1.5"
              className={cn(
                'field w-24 shrink-0 font-mono tabular-nums',
                durationFlash && 'border-growth-400/70 ring-4 ring-growth-400/30',
                errors.durationHours && 'border-rose-400/60',
              )}
              aria-invalid={Boolean(errors.durationHours)}
              aria-describedby={errors.durationHours ? `${ids.duration}-err` : undefined}
            />
            <div className="flex flex-1 flex-wrap items-center gap-1.5" role="group" aria-label="Quick duration presets">
              {QUICK_DURATIONS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => update({ durationHours: String(h) })}
                  aria-pressed={Number(values.durationHours) === h}
                  className={cn(
                    'rounded-lg px-2.5 py-1.5 font-mono text-xs transition-colors ring-1 ring-inset',
                    Number(values.durationHours) === h
                      ? 'bg-tech-500/20 text-tech-200 ring-tech-400/40'
                      : 'text-slate-400 ring-white/10 hover:bg-white/[0.06] hover:text-slate-200',
                  )}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
          {errors.durationHours && (
            <p id={`${ids.duration}-err`} className="mt-1.5 text-xs text-rose-300">
              {errors.durationHours}
            </p>
          )}
        </div>
      </div>

      {/* Artifact */}
      <div>
        <label htmlFor={ids.artifact} className="field-label flex items-center gap-1.5">
          <GitCommitHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Output / artifact link / git commit
        </label>
        <input
          id={ids.artifact}
          type="text"
          value={values.outputArtifact}
          onChange={(e) => update({ outputArtifact: e.target.value })}
          placeholder="GitHub PR #4 · commit a1b8c4d · notes/event-loop.md"
          className="field font-mono text-[13px]"
          autoComplete="off"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor={ids.notes} className="field-label flex items-center gap-1.5">
          <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" /> Learnings &amp; blockers
        </label>
        <textarea
          id={ids.notes}
          rows={4}
          value={values.notesAndBlockers}
          onChange={(e) => update({ notesAndBlockers: e.target.value })}
          onKeyDown={onTextareaKey}
          placeholder="What clicked? What's blocking you? What will you try next session?"
          className="field resize-y leading-relaxed"
          aria-describedby={`${ids.notes}-hint`}
        />
        <p id={`${ids.notes}-hint`} className="mt-1.5 text-[11px] text-slate-500">
          Tip: press <kbd className="kbd">⌘</kbd> / <kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">Enter</kbd> to log instantly.
        </p>
      </div>

      {/* Status + submit */}
      <div className="flex flex-col gap-4 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-end sm:justify-between">
        <fieldset>
          <legend className="field-label">Status</legend>
          <div className="inline-flex rounded-xl bg-ink-950/60 p-1 ring-1 ring-white/[0.06]">
            {LOG_STATUSES.map((s) => (
              <label
                key={s}
                className={cn(
                  'cursor-pointer rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 ring-1 ring-transparent transition-all hover:text-slate-200',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tech-400',
                  STATUS_STYLES[s],
                )}
              >
                <input
                  type="radio"
                  name={`${uid}-status`}
                  value={s}
                  checked={values.status === s}
                  onChange={() => setStatus(s)}
                  className="sr-only"
                />
                {s}
              </label>
            ))}
          </div>
        </fieldset>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          id="log-today-button"
          className="w-full bg-gradient-to-r from-tech-600 to-growth-600 hover:from-tech-700 hover:to-growth-700 sm:w-auto"
          leftIcon={<Rocket className="h-4 w-4" aria-hidden="true" />}
        >
          Log Today's Work
        </Button>
      </div>
    </form>
  );
}
