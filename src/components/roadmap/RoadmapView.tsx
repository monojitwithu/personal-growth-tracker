import { useMemo, useState } from 'react';
import { Layers, Trophy, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WeekCard } from './WeekCard';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/Progress';
import { splitPhase } from '../../lib/stats';
import { phaseTone } from '../../lib/modes';
import type { TabId } from '../../types';

interface RoadmapViewProps {
  onNavigateTab: (tab: TabId) => void;
}

export function RoadmapView({ onNavigateTab }: RoadmapViewProps) {
  const { state, calendarWeek, toggleMilestone, toggleTopic, setActiveWeek } = useApp();
  const [selectedPhase, setSelectedPhase] = useState<string>('all');

  // Group weeks by Phase
  const phases = useMemo(() => {
    const map = new Map<string, typeof state.weeks>();
    state.weeks.forEach((w) => {
      const existing = map.get(w.phase) ?? [];
      existing.push(w);
      map.set(w.phase, existing);
    });
    return Array.from(map.entries()).map(([phase, weeks]) => ({
      phase,
      weeks,
      ...splitPhase(phase),
    }));
  }, [state.weeks]);

  const totalMilestones = state.weeks.length;
  const completedMilestones = state.weeks.filter((w) => w.isMilestoneCompleted).length;
  const milestonesPercent = Math.round((completedMilestones / totalMilestones) * 100);

  const handleSelectWeekInCockpit = (weekNumber: number) => {
    setActiveWeek(weekNumber);
    onNavigateTab('cockpit');
  };

  const filteredWeeks = selectedPhase === 'all'
    ? state.weeks
    : state.weeks.filter((w) => w.phase === selectedPhase);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. Roadmap Overview & Timeline Banner */}
      <section className="glass rounded-3xl p-6 sm:p-8 relative overflow-hidden" aria-labelledby="roadmap-title">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tech-500/15 border border-tech-400/30 text-xs font-semibold text-tech-300">
              <Layers className="w-3.5 h-3.5" />
              {state.weeks.length}-Week Full-Stack Transition Architecture
            </span>
            <h1 id="roadmap-title" className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Senior Frontend → Lead Full-Stack Mastery
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Curated {phases.length}-phase engineering progression through JavaScript engine internals, React 19, Next.js App Router, 
              modern rendering architectures (SSR/CSR/SSG/ISR/RSC/PPR), Node.js backend systems, cloud infrastructure on GCP, and scalable distributed system design.
            </p>
          </div>

          {/* Progress Snapshot Card */}
          <Card className="p-5 border-white/10 shrink-0 min-w-[260px]" glow="growth">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-mono font-semibold uppercase text-growth-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Milestone Velocity
              </span>
              <span className="font-mono text-sm font-bold text-white">
                {completedMilestones}/{totalMilestones} done
              </span>
            </div>
            <ProgressBar value={completedMilestones / totalMilestones} label="Milestones completion progress" size="sm" />
            <p className="mt-2 text-[11px] text-slate-400">
              {milestonesPercent}% of major weekly architectural deliverables completed
            </p>
          </Card>
        </div>

        {/* Visual Multi-Phase Gantt / Progression Strip */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] overflow-x-auto scrollbar-thin">
          <div 
            className="min-w-[980px] grid gap-3"
            style={{ gridTemplateColumns: `repeat(${phases.length}, minmax(180px, 1fr))` }}
          >
            {phases.map((p, idx) => {
              const tone = phaseTone(p.phase);
              const phaseMilestonesDone = p.weeks.filter((w) => w.isMilestoneCompleted).length;
              const isCurrent = p.weeks.some((w) => w.weekNumber === calendarWeek);

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition ${
                    isCurrent
                      ? 'bg-tech-500/10 border-tech-400/40 ring-1 ring-tech-400/20'
                      : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                      {p.key}
                    </span>
                    <Badge tone={tone} className="text-[10px] px-1.5 py-0">
                      W{p.weeks[0].weekNumber}–W{p.weeks[p.weeks.length - 1].weekNumber}
                    </Badge>
                  </div>
                  <div className="text-xs font-semibold text-slate-200 line-clamp-1 mb-2">
                    {p.name}
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{phaseMilestonesDone}/{p.weeks.length} milestones</span>
                    {phaseMilestonesDone === p.weeks.length && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-growth-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Filter Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedPhase('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
              selectedPhase === 'all'
                ? 'bg-white/10 text-white border-white/20'
                : 'text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/5'
            }`}
          >
            All 10 Weeks
          </button>
          {phases.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedPhase(p.phase)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                selectedPhase === p.phase
                  ? 'bg-tech-500/20 text-tech-300 border-tech-400/30'
                  : 'text-slate-400 border-white/[0.06] hover:text-white hover:bg-white/5'
              }`}
            >
              {p.key}: {p.name.split('&')[0].trim()}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredWeeks.length} of 10 weeks
        </span>
      </div>

      {/* 3. 10-Week Cards Timeline */}
      <div className="space-y-4">
        {filteredWeeks.map((week) => (
          <WeekCard
            key={week.weekNumber}
            week={week}
            logs={state.logs}
            isActiveWeek={week.weekNumber === state.activeWeek}
            isCalendarWeek={week.weekNumber === calendarWeek}
            onToggleMilestone={toggleMilestone}
            onToggleTopic={toggleTopic}
            onSelectWeek={handleSelectWeekInCockpit}
          />
        ))}
      </div>
    </div>
  );
}
