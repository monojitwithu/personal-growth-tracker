import { CircleCheckBig, PenLine, Sparkles } from 'lucide-react';
import { useId } from 'react';
import { cn } from '../../lib/cn';
import type { DailyTaskOption, WeekData } from '../../types';
import { Badge, ModeBadge } from '../ui/Badge';

export const CUSTOM_TASK = 'custom' as const;
export type TaskSelection = string | typeof CUSTOM_TASK | null;

interface TaskPickerProps {
  week: WeekData;
  completedIds: Set<string>;
  selected: TaskSelection;
  onSelect: (option: DailyTaskOption | typeof CUSTOM_TASK) => void;
}

/** Radio-card picker over this week's 5 curated options + a "Custom Task" escape hatch. */
export function TaskPicker({ week, completedIds, selected, onSelect }: TaskPickerProps) {
  const groupName = useId();
  const labelId = useId();

  return (
    <fieldset>
      <legend id={labelId} className="sr-only">
        Choose today's task for Week {week.weekNumber}
      </legend>
      <div role="radiogroup" aria-labelledby={labelId} className="grid gap-3.5 sm:grid-cols-2">
        {week.dailyOptions.map((opt, i) => {
          const done = completedIds.has(opt.id);
          const isSelected = selected === opt.id;
          return (
            <label
              key={opt.id}
              htmlFor={`task-${opt.id}`}
              className={cn(
                'group relative flex cursor-pointer flex-col gap-2.5 rounded-2xl border p-4 sm:p-5 transition-all duration-200',
                'border-white/[0.08] bg-white/[0.02] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.04]',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tech-400',
                isSelected &&
                  'border-tech-400/60 bg-tech-500/[0.08] shadow-[0_0_0_1px_rgb(56_189_248/0.25),0_12px_32px_-16px_rgb(2_132_199/0.6)] hover:border-tech-400/60 hover:bg-tech-500/[0.1]',
              )}
            >
              <input
                type="radio"
                id={`task-${opt.id}`}
                name={groupName}
                value={opt.id}
                checked={isSelected}
                onChange={() => onSelect(opt)}
                className="sr-only"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-400 font-medium" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <ModeBadge mode={opt.mode} />
                </div>
                {done ? (
                  <Badge tone="emerald" icon={<CircleCheckBig className="h-3.5 w-3.5" aria-hidden="true" />}>
                    Logged
                  </Badge>
                ) : (
                  <span
                    className={cn(
                      'h-4 w-4 rounded-full border-2 transition-colors',
                      isSelected ? 'border-tech-400 bg-tech-400 shadow-[inset_0_0_0_2px_var(--color-ink-900)]' : 'border-slate-600',
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className={cn('text-sm sm:text-base leading-snug font-bold', isSelected ? 'text-white' : 'text-slate-100')}>
                {opt.title}
              </p>
              <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-300 group-hover:line-clamp-none">{opt.description}</p>
            </label>
          );
        })}

        <label
          htmlFor={`task-custom-${week.weekNumber}`}
          className={cn(
            'group relative flex cursor-pointer flex-col justify-center gap-2.5 rounded-2xl border border-dashed p-4 sm:p-5 transition-all duration-200',
            'border-white/15 bg-transparent hover:border-white/25 hover:bg-white/[0.03]',
            'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-tech-400',
            selected === CUSTOM_TASK && 'border-warn-400/60 bg-warn-500/[0.06]',
          )}
        >
          <input
            type="radio"
            id={`task-custom-${week.weekNumber}`}
            name={groupName}
            value={CUSTOM_TASK}
            checked={selected === CUSTOM_TASK}
            onChange={() => onSelect(CUSTOM_TASK)}
            className="sr-only"
          />
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-warn-500/15 text-warn-300" aria-hidden="true">
              <PenLine className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm sm:text-base font-bold text-slate-100">Custom Task</p>
              <p className="text-xs sm:text-sm text-slate-400">Log something outside this week's menu</p>
            </div>
          </div>
        </label>
      </div>

      {completedIds.size === week.dailyOptions.length && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-growth-300">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Every curated option this week has been logged. Outstanding.
        </p>
      )}
    </fieldset>
  );
}
