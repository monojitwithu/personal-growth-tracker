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
  isActiveWeek: boolean;
  isCalendarWeek: boolean;
  onToggleMilestone: (weekNumber: number) => void;
  onToggleTopic: (weekNumber: number, topic: string) => void;
  onSelectWeek: (weekNumber: number) => void;
}

export function WeekCard({
  week,
  logs,
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

  return (
    <Card 
      className={`transition-all duration-200 border ${
        isActiveWeek 
          ? 'border-tech-400/50 bg-ink-900/90 shadow-[0_0_24px_-8px_rgb(2_132_199/0.3)]' 
          : 'border-white/[0.08] hover:border-white/20'
      }`}
      glow={isActiveWeek ? 'tech' : null}
    >
      {/* Header bar */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-tech-400 bg-tech-500/10 px-2.5 py-0.5 rounded-lg border border-tech-500/20">
                WEEK {week.weekNumber}
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {week.dateRange}
              </span>
              <Badge tone={tone} dot>
                {week.phase.split(':')[0]}
              </Badge>
              {isCalendarWeek && (
                <Badge tone="emerald" dot>
                  Current Calendar Week
                </Badge>
              )}
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              {week.title}
            </h3>
          </div>

          {/* Quick Actions & Session Progress */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-200">
                {completedSessions} / {SESSIONS_PER_WEEK} <span className="text-slate-400 font-normal">sessions</span>
              </div>
              <div className="w-24 sm:w-32 mt-1.5">
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
              className="text-xs font-semibold"
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
        <div className="mt-4 pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-3 bg-white/[0.02] -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 px-5 sm:px-6 py-3 rounded-b-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className={`w-4 h-4 shrink-0 ${week.isMilestoneCompleted ? 'text-growth-400' : 'text-slate-500'}`} />
            <span className="text-xs text-slate-300 truncate">
              <strong className="text-slate-200">Milestone:</strong> {week.milestoneDeliverable}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleMilestone(week.weekNumber)}
            className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition border ${
              week.isMilestoneCompleted
                ? 'bg-growth-500/15 text-growth-300 border-growth-400/30'
                : 'text-slate-400 border-white/10 hover:text-white hover:bg-white/5'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${week.isMilestoneCompleted ? 'text-growth-400' : 'text-slate-500'}`} />
            {week.isMilestoneCompleted ? 'Achieved' : 'Mark Done'}
          </button>
        </div>
      </div>

      {/* Collapsible Details */}
      {isExpanded && (
        <div className="p-5 sm:p-6 border-t border-white/[0.08] bg-ink-950/40 space-y-6 animate-fade-in">
          {/* 1. Topics Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-tech-400 font-semibold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Engineering Knowledge Topics ({doneTopics.size}/{week.topics.length} reviewed)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {week.topics.map((topic, i) => {
                const isChecked = doneTopics.has(topic);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onToggleTopic(week.weekNumber, topic)}
                    className={`flex items-start text-left gap-2.5 p-2.5 rounded-xl border transition text-xs leading-relaxed ${
                      isChecked
                        ? 'bg-tech-500/[0.08] border-tech-400/30 text-slate-200'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:border-white/15'
                    }`}
                  >
                    {isChecked ? (
                      <CheckCircle2 className="w-4 h-4 text-tech-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    )}
                    <span className={isChecked ? 'text-slate-200' : 'text-slate-300'}>{topic}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Curated Daily Task Options */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-growth-400 font-semibold mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              5 Curated Daily Practice Options
            </h4>

            <div className="space-y-2">
              {week.dailyOptions.map((opt, i) => {
                const isLogged = completedOptions.has(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border text-xs ${
                      isLogged
                        ? 'bg-growth-500/[0.06] border-growth-400/30 text-slate-200'
                        : 'bg-white/[0.02] border-white/[0.06] text-slate-300'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-slate-500 font-semibold">{i + 1}.</span>
                        <ModeBadge mode={opt.mode} compact />
                        <span className="font-semibold text-white">{opt.title}</span>
                        {isLogged && (
                          <Badge tone="emerald" dot>
                            Logged
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed pl-5">
                        {opt.description}
                      </p>
                    </div>

                    {!isLogged && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectWeek(week.weekNumber)}
                        className="text-[11px] shrink-0 self-start sm:self-center text-tech-300 hover:text-tech-200"
                        rightIcon={<ArrowRight className="w-3 h-3" />}
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
