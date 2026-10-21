import { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { formatShortDate } from '../../lib/date';
import type { ScheduleHealth } from '../../lib/stats';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ScheduleHealthBannerProps {
  health: ScheduleHealth;
  onToggleMilestone: (weekNumber: number) => void;
  onToggleTopic: (weekNumber: number, topic: string) => void;
  onSelectWeek: (weekNumber: number) => void;
}

export function ScheduleHealthBanner({
  health,
  onToggleMilestone,
  onToggleTopic,
  onSelectWeek,
}: ScheduleHealthBannerProps) {
  const [isBacklogExpanded, setIsBacklogExpanded] = useState(false);

  const isDelayed = health.status === 'delayed';
  const isAhead = health.status === 'ahead';

  return (
    <section
      className={`glass rounded-3xl p-6 sm:p-7 relative overflow-hidden border transition-all ${
        isDelayed
          ? 'border-warn-400/40 bg-warn-500/[0.04]'
          : isAhead
          ? 'border-tech-400/40 bg-tech-500/[0.04]'
          : 'border-growth-400/30 bg-growth-500/[0.03]'
      }`}
      aria-label="Target Schedule and Backlog Diagnostics"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Left: Status & Diagnosis */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-wider font-bold text-slate-400">
              Schedule Health
            </span>
            {isDelayed ? (
              <Badge tone="amber" dot className="px-2.5 py-1 text-xs font-semibold">
                Behind Schedule (+{health.daysDelayed}d slip)
              </Badge>
            ) : isAhead ? (
              <Badge tone="tech" dot className="px-2.5 py-1 text-xs font-semibold">
                Ahead of Schedule
              </Badge>
            ) : (
              <Badge tone="emerald" dot className="px-2.5 py-1 text-xs font-semibold">
                100% On Track
              </Badge>
            )}

            {health.backlogItems.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-400/30 text-xs font-semibold text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5" />
                {health.backlogItems.length} Backlog Item{health.backlogItems.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            {isDelayed ? (
              <>
                <TrendingDown className="w-6 h-6 text-warn-400 shrink-0" />
                <span>Target Timeline Delay Detected</span>
              </>
            ) : isAhead ? (
              <>
                <TrendingUp className="w-6 h-6 text-tech-400 shrink-0" />
                <span>Accelerated Completion Pace</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 text-growth-400 shrink-0" />
                <span>Curriculum Pacing On Target</span>
              </>
            )}
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {health.summaryText}
          </p>
        </div>

        {/* Right: Target Date Comparison Widget */}
        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap shrink-0">
          <div className="bg-ink-950/70 border border-white/10 rounded-2xl p-4 sm:p-5 min-w-[200px] space-y-1.5 shadow-sm">
            <div className="text-xs font-mono font-medium text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-tech-400" />
              Planned Target
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {formatShortDate(health.plannedTargetDate)}, {health.plannedTargetDate.slice(0, 4)}
            </div>
            <div className="text-xs text-slate-400">Baseline milestone date</div>
          </div>

          <div
            className={`border rounded-2xl p-4 sm:p-5 min-w-[200px] space-y-1.5 shadow-sm ${
              isDelayed
                ? 'bg-warn-500/10 border-warn-400/40'
                : 'bg-growth-500/10 border-growth-400/30'
            }`}
          >
            <div className="text-xs font-mono font-medium text-slate-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-warn-400" />
              Projected Completion
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {formatShortDate(health.projectedTargetDate)}, {health.projectedTargetDate.slice(0, 4)}
            </div>
            <div className="text-xs text-slate-300">
              {isDelayed
                ? `+${health.daysDelayed} days adjustment needed`
                : 'No estimated schedule slip'}
            </div>
          </div>
        </div>
      </div>

      {/* Backlog Item Accordion if Backlog Exists */}
      {health.backlogItems.length > 0 && (
        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsBacklogExpanded(!isBacklogExpanded)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white transition"
            >
              <AlertTriangle className="w-4 h-4 text-warn-400" />
              <span>Review Past Weeks Backlog ({health.backlogItems.length} items to clear)</span>
              {isBacklogExpanded ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </button>

            <span className="text-xs text-slate-400">
              Click any item to resolve directly
            </span>
          </div>

          {isBacklogExpanded && (
            <div className="mt-4 space-y-2.5 animate-fade-in">
              {health.backlogItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-tech-400 bg-tech-500/10 px-2 py-0.5 rounded border border-tech-500/20">
                        W{item.weekNumber}
                      </span>
                      <span className="text-xs text-slate-400 truncate max-w-xs">
                        {item.weekTitle}
                      </span>
                      <Badge tone={item.type === 'milestone' ? 'amber' : 'rose'} className="text-[10px]">
                        {item.type === 'milestone' ? 'Overdue Milestone' : 'Unfinished Topic'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-snug">
                      {item.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSelectWeek(item.weekNumber)}
                      className="text-xs"
                    >
                      Jump to W{item.weekNumber}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (item.type === 'milestone') {
                          onToggleMilestone(item.weekNumber);
                        } else {
                          onToggleTopic(item.weekNumber, item.title);
                        }
                      }}
                      className="text-xs"
                      leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
