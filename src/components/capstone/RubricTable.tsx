import { Award } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/Progress';
import { useToast } from '../ui/Toast';
import type { CompetencyItem, CompetencyStatus } from '../../types';

export function RubricTable() {
  const { state, updateCompetency } = useApp();
  const { toast } = useToast();

  const total = state.competencies.length;
  const prodReady = state.competencies.filter((c) => c.status === 'Production Ready').length;
  const inProgress = state.competencies.filter((c) => c.status === 'In Progress').length;
  const readinessPercent = Math.round(((prodReady * 1 + inProgress * 0.5) / total) * 100);

  const cycleStatus = (item: CompetencyItem) => {
    let next: CompetencyStatus;
    if (item.status === 'Not Started') next = 'In Progress';
    else if (item.status === 'In Progress') next = 'Production Ready';
    else next = 'Not Started';

    updateCompetency(item.id, next);
    toast({
      tone: next === 'Production Ready' ? 'success' : 'info',
      title: `${item.title}`,
      description: `Rating set to: ${next}`,
    });
  };

  const getStatusBadge = (status: CompetencyStatus) => {
    switch (status) {
      case 'Production Ready':
        return (
          <Badge tone="emerald" dot>
            Production Ready
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge tone="tech" dot>
            In Progress
          </Badge>
        );
      case 'Not Started':
      default:
        return (
          <Badge tone="slate" dot>
            Not Started
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-white/[0.08]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-tech-500/15 text-tech-400 border border-tech-400/30">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Lead Full-Stack &amp; EM/PM Competency Rubric
            </h2>
            <p className="text-xs text-slate-400">
              Interactive 9-pillar self-assessment benchmarked against Staff / Lead engineering expectations
            </p>
          </div>
        </div>

        {/* Readiness Meter */}
        <div className="bg-ink-950/70 border border-white/10 rounded-2xl p-3 min-w-[240px]">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-mono text-slate-400">Readiness Score</span>
            <span className="font-mono font-bold text-growth-400">{readinessPercent}%</span>
          </div>
          <ProgressBar value={readinessPercent / 100} label="Senior Readiness Score" size="xs" />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
            <span>{prodReady} Prod Ready</span>
            <span>{inProgress} In Progress</span>
            <span>{total - prodReady - inProgress} Unstarted</span>
          </div>
        </div>
      </div>

      {/* Rubric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.competencies.map((item, idx) => (
          <Card
            key={item.id}
            className={`p-5 flex flex-col justify-between transition-all border ${
              item.status === 'Production Ready'
                ? 'border-growth-500/40 bg-growth-500/[0.03]'
                : item.status === 'In Progress'
                ? 'border-tech-500/40 bg-tech-500/[0.03]'
                : 'border-white/[0.08]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[11px] font-bold text-slate-500">
                  #{idx + 1}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <h3 className="text-sm font-bold text-white leading-snug">
                {item.title}
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                {item.benchmark}
              </p>
            </div>

            {/* Interactive Toggle Button */}
            <div className="mt-5 pt-3.5 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Click to advance rating:</span>
              <button
                type="button"
                onClick={() => cycleStatus(item)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-white/15 bg-white/[0.04] text-slate-200 hover:text-white hover:bg-white/10 hover:border-white/25 transition active:scale-95"
              >
                Toggle Status
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
