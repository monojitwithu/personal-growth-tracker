import { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  Trophy, 
  BookOpen, 
  Layers, 
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge, ModeBadge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/Progress';
import { weekSessionCount, SESSIONS_PER_WEEK, completedOptionIds } from '../../lib/stats';
import { phaseTone } from '../../lib/modes';
import type { DailyLog, WeekData } from '../../types';

interface WeekCardProps {
  week: WeekData;
  logs: DailyLog[];
  today?: string;
  isActiveWeek: boolean;
  isCalendarWeek: boolean;
  onToggleMilestone: (weekNumber: number) => void;
  onToggleTopic: (weekNumber: number, topic: string) => void;
  onSelectWeek: (weekNumber: number) => void;
}

export function WeekCard({
  week,
  logs,
  today,
  isActiveWeek,
  isCalendarWeek,
  onToggleMilestone,
  onToggleTopic,
  onSelectWeek,
}: WeekCardProps) {
  const [isExpanded, setIsExpanded] = useState(isActiveWeek || isCalendarWeek);

  const completedSessions = weekSessionCount(logs, week.weekNumber);
  const completedOptions = completedOptionIds(week, logs);
  const doneTopics = new Set(week.completedTopics ?? []);
  const tone = phaseTone(week.phase);

  const isPastWeek = Boolean(today && week.endDate < today);
  const unfinishedTopicsCount = week.topics.length - doneTopics.size;
  const isBacklogPending = isPastWeek && (!week.isMilestoneCompleted || unfinishedTopicsCount > 0);

  return (
    <Card 
      className={`transition-all duration-200 border ${
        isBacklogPending
          ? 'border-warn-400/50 bg-warn-500/[0.03] shadow-[0_0_24px_-8px_rgb(245_158_11/0.25)]'
          : isActiveWeek 
          ? 'border-tech-400/50 bg-ink-900/90 shadow-[0_0_24px_-8px_rgb(2_132_199/0.3)]' 
          : 'border-white/[0.08] hover:border-white/20'
      }`}
      glow={isBacklogPending ? 'warn' : isActiveWeek ? 'tech' : null}
    >
      {/* Header bar */}
      <div className="p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold text-tech-400 bg-tech-500/10 px-2.5 py-1 rounded-lg border border-tech-500/20">
                WEEK {week.weekNumber}
              </span>
              <span className="text-xs sm:text-sm text-slate-300 font-mono flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {week.dateRange}
              </span>
              <Badge tone={tone} dot className="px-2.5 py-0.5 text-xs">
                {week.phase.split(':')[0]}
              </Badge>
              {isCalendarWeek && (
                <Badge tone="emerald" dot className="px-2.5 py-0.5 text-xs">
                  Current Calendar Week
                </Badge>
              )}
              {isBacklogPending && (
                <Badge tone="amber" dot className="px-2.5 py-0.5 text-xs font-semibold">
                  ⚠️ Delayed / Backlog Pending ({unfinishedTopicsCount > 0 ? `${unfinishedTopicsCount} topics` : ''}{!week.isMilestoneCompleted ? (unfinishedTopicsCount > 0 ? ', milestone' : 'milestone') : ''})
                </Badge>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              {week.title}
            </h3>
          </div>

          {/* Quick Actions & Session Progress */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-xs sm:text-sm font-mono font-bold text-slate-200">
                {completedSessions} / {SESSIONS_PER_WEEK} <span className="text-slate-400 font-normal">sessions</span>
              </div>
              <div className="w-28 sm:w-36 mt-1.5">
                <ProgressBar
                  value={completedSessions / SESSIONS_PER_WEEK}
                  label={`Week ${week.weekNumber} completion progress`}
                  size="xs"
                />
              </div>
            </div>

            <Button
              variant={isActiveWeek ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => onSelectWeek(week.weekNumber)}
              className="text-xs sm:text-sm font-semibold px-3.5 py-2"
            >
              {isActiveWeek ? 'Active in Cockpit' : 'Open in Cockpit'}
            </Button>

            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label={isExpanded ? 'Collapse week details' : 'Expand week details'}
            >
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Milestone Bar (Always Visible) */}
        <div className={`mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3 -mx-6 sm:-mx-7 -mb-6 sm:-mb-7 px-6 sm:px-7 py-3.5 rounded-b-2xl ${
          isPastWeek && !week.isMilestoneCompleted ? 'bg-warn-500/[0.08]' : 'bg-white/[0.02]'
        }`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className={`w-4 h-4 shrink-0 ${week.isMilestoneCompleted ? 'text-growth-400' : isPastWeek ? 'text-warn-400' : 'text-slate-500'}`} />
            <span className="text-xs sm:text-sm text-slate-300 truncate">
              <strong className="text-slate-200">Milestone:</strong> {week.milestoneDeliverable}
              {isPastWeek && !week.isMilestoneCompleted && (
                <span className="ml-2 text-xs text-warn-400 font-semibold">(Overdue target)</span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleMilestone(week.weekNumber)}
            className={`shrink-0 flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-xl transition border ${
              week.isMilestoneCompleted
                ? 'bg-growth-500/15 text-growth-300 border-growth-400/30'
                : isPastWeek
                ? 'bg-warn-500/15 text-warn-300 border-warn-400/40 hover:bg-warn-500/25'
                : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${week.isMilestoneCompleted ? 'text-growth-400' : isPastWeek ? 'text-warn-400' : 'text-slate-500'}`} />
            {week.isMilestoneCompleted ? 'Achieved' : 'Mark Done'}
          </button>
        </div>
      </div>

      {/* Collapsible Details */}
      {isExpanded && (
        <div className="p-6 sm:p-7 border-t border-white/[0.08] bg-ink-950/40 space-y-7 animate-fade-in">
          {/* 1. Topics Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="text-xs sm:text-sm font-mono uppercase tracking-wider text-tech-400 font-bold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Engineering Knowledge Topics ({doneTopics.size}/{week.topics.length} reviewed)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
              {week.topics.map((topic, i) => {
                const isChecked = doneTopics.has(topic);
                const isTopicOverdue = isPastWeek && !isChecked;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onToggleTopic(week.weekNumber, topic)}
                    className={`flex items-start text-left gap-3 p-3 sm:p-3.5 rounded-xl border transition text-sm leading-relaxed ${
                      isChecked
                        ? 'bg-tech-500/[0.08] border-tech-400/30 text-slate-200'
                        : isTopicOverdue
                        ? 'bg-warn-500/[0.06] border-warn-400/30 text-slate-300 hover:border-warn-400/50'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-300 hover:text-slate-100 hover:border-white/15'
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-tech-400 shrink-0 mt-0.5" />
                    ) : isTopicOverdue ? (
                      <Circle className="w-4 h-4 text-warn-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className={isChecked ? 'text-slate-200 font-medium' : 'text-slate-300'}>{topic}</span>
                      {isTopicOverdue && (
                        <span className="block text-[11px] text-warn-400 font-mono mt-0.5 font-semibold">Backlog pending</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Curated Daily Task Options */}
          <div>
            <h4 className="text-xs sm:text-sm font-mono uppercase tracking-wider text-growth-400 font-bold mb-3.5 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              5 Curated Daily Practice Options
            </h4>

            <div className="space-y-3">
              {week.dailyOptions.map((opt, i) => {
                const isLogged = completedOptions.has(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl border text-sm ${
                      isLogged
                        ? 'bg-growth-500/[0.06] border-growth-400/30 text-slate-200'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-slate-500 font-semibold">{i + 1}.</span>
                        <ModeBadge mode={opt.mode} compact />
                        <span className="font-semibold text-white text-sm">{opt.title}</span>
                        {isLogged && (
                          <Badge tone="emerald" dot className="text-xs">
                            Logged
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed pl-5">
                        {opt.description}
                      </p>
                    </div>

                    {!isLogged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectWeek(week.weekNumber)}
                        className="text-xs sm:text-sm shrink-0 self-start sm:self-center text-tech-300 hover:text-tech-200"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                      >
                        Log this task
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
