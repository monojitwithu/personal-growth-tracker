import { useState, useRef } from 'react';
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Flame, Target, Trophy, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressRing } from '../ui/Progress';
import { useToast } from '../ui/Toast';
import { TaskPicker, CUSTOM_TASK, type TaskSelection } from './TaskPicker';
import { FocusTimer } from './FocusTimer';
import { DailyLogForm, type LogFormValues } from './DailyLogForm';
import { ScheduleHealthBanner } from './ScheduleHealthBanner';
import { weekSessionCount, SESSIONS_PER_WEEK, completedOptionIds, computeScheduleHealth } from '../../lib/stats';
import { formatLongDate } from '../../lib/date';
import type { DailyTaskOption, TabId } from '../../types';

interface TodayCockpitProps {
  onNavigateTab: (tab: TabId) => void;
}

export function TodayCockpit({ onNavigateTab }: TodayCockpitProps) {
  const {
    state,
    today,
    activeWeekData,
    calendarWeek,
    streak,
    daysRemaining,
    addLog,
    toggleMilestone,
    toggleTopic,
    setActiveWeek,
  } = useApp();
  const { toast } = useToast();

  const [selectedTask, setSelectedTask] = useState<TaskSelection>(null);
  const [durationFlash, setDurationFlash] = useState(false);
  const flashTimeoutRef = useRef<number | null>(null);

  const initialFormValues: LogFormValues = {
    taskTitle: '',
    mode: 'Mode A',
    date: today,
    durationHours: '1.5',
    outputArtifact: '',
    notesAndBlockers: '',
    status: 'Completed',
  };

  const [formValues, setFormValues] = useState<LogFormValues>(initialFormValues);

  const activeWeekSessions = weekSessionCount(state.logs, activeWeekData.weekNumber);
  const completedOptions = completedOptionIds(activeWeekData, state.logs);
  const momentumPercent = Math.min(100, Math.round((activeWeekSessions / SESSIONS_PER_WEEK) * 100));

  const handleSelectTask = (option: DailyTaskOption | typeof CUSTOM_TASK) => {
    if (option === CUSTOM_TASK) {
      setSelectedTask(CUSTOM_TASK);
      setFormValues((prev) => ({
        ...prev,
        taskTitle: '',
        mode: 'Mode A',
      }));
    } else {
      setSelectedTask(option.id);
      setFormValues((prev) => ({
        ...prev,
        taskTitle: option.title,
        mode: option.mode,
      }));
    }
  };

  const handleTimerCapture = (hours: number) => {
    setFormValues((prev) => ({
      ...prev,
      durationHours: hours.toFixed(1),
    }));
    setDurationFlash(true);
    if (flashTimeoutRef.current) window.clearTimeout(flashTimeoutRef.current);
    flashTimeoutRef.current = window.setTimeout(() => setDurationFlash(false), 2000);
  };

  const handleSubmitLog = () => {
    const dur = parseFloat(formValues.durationHours) || 0;
    addLog({
      date: formValues.date,
      mode: formValues.mode,
      taskTitle: formValues.taskTitle,
      durationHours: dur,
      outputArtifact: formValues.outputArtifact,
      notesAndBlockers: formValues.notesAndBlockers,
      status: formValues.status,
    });

    toast({
      tone: 'success',
      title: 'Session Logged Successfully',
      description: `Logged ${dur}h for "${formValues.taskTitle}"`,
    });

    // Reset form
    setFormValues({
      ...initialFormValues,
      date: formValues.date,
    });
    setSelectedTask(null);
  };

  const canGoPrev = activeWeekData.weekNumber > 1;
  const canGoNext = activeWeekData.weekNumber < state.weeks.length;
  const scheduleHealth = computeScheduleHealth(state.weeks, today);

  return (
    <div className="space-y-8 sm:space-y-10 animate-fade-in pb-20">
      {/* 1. Header Banner */}
      <section className="glass rounded-3xl p-7 sm:p-8 relative overflow-hidden" aria-labelledby="cockpit-banner-title">
        <div className="absolute top-0 right-0 w-96 h-96 bg-tech-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-tech-500/15 border border-tech-400/30 text-xs font-semibold text-tech-300">
                <Calendar className="w-4 h-4" />
                {formatLongDate(today)}
              </span>
              {activeWeekData.weekNumber === calendarWeek && (
                <Badge tone="emerald" dot className="px-2.5 py-1 text-xs">
                  Active Current Week
                </Badge>
              )}
            </div>
            
            <h1 id="cockpit-banner-title" className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Week {activeWeekData.weekNumber}: {activeWeekData.title}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 flex items-center gap-2.5">
              <span className="font-mono text-slate-200 font-medium">{activeWeekData.dateRange}</span>
              <span>•</span>
              <span className="text-tech-400 font-semibold">{activeWeekData.phase}</span>
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Week Switcher */}
            <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-2xl p-1.5 gap-1.5">
              <button
                type="button"
                disabled={!canGoPrev}
                onClick={() => setActiveWeek(activeWeekData.weekNumber - 1)}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition rounded-xl hover:bg-white/10"
                aria-label="Previous week"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-mono font-bold text-slate-100">
                W{activeWeekData.weekNumber}/{state.weeks.length}
              </span>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setActiveWeek(activeWeekData.weekNumber + 1)}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition rounded-xl hover:bg-white/10"
                aria-label="Next week"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Streak & Countdown Card */}
            <div className="flex items-center gap-4 bg-ink-950/70 border border-white/10 rounded-2xl px-5 py-3">
              <div className="flex items-center gap-2.5 pr-4 border-r border-white/10">
                <Flame className="w-6 h-6 text-warn-400 animate-flicker" />
                <div>
                  <div className="text-lg font-bold font-mono text-white leading-none">{streak}</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Streak</div>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Target className="w-6 h-6 text-tech-400" />
                <div>
                  <div className="text-lg font-bold font-mono text-white leading-none">{daysRemaining}d</div>
                  <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Schedule Health & Backlog Diagnosis Banner */}
      <ScheduleHealthBanner
        health={scheduleHealth}
        onToggleMilestone={toggleMilestone}
        onToggleTopic={toggleTopic}
        onSelectWeek={setActiveWeek}
      />

      {/* 3. Weekly Objective Banner & Momentum Meter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-6 sm:p-7 border-tech-500/30" glow="tech">
          <div className="flex items-start justify-between gap-5">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono uppercase tracking-wider text-tech-400 font-bold flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  Week {activeWeekData.weekNumber} Milestone Deliverable
                </span>
                {activeWeekData.isMilestoneCompleted && (
                  <Badge tone="emerald" dot>Completed</Badge>
                )}
              </div>
              <p className="text-lg sm:text-xl font-semibold text-slate-100 leading-snug">
                {activeWeekData.milestoneDeliverable}
              </p>
            </div>
            
            <button
              type="button"
              id="toggle-milestone-button"
              onClick={() => toggleMilestone(activeWeekData.weekNumber)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition border ${
                activeWeekData.isMilestoneCompleted
                  ? 'bg-growth-500/20 text-growth-300 border-growth-400/40 hover:bg-growth-500/30'
                  : 'bg-white/[0.05] text-slate-200 border-white/15 hover:bg-white/10 hover:text-white'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${activeWeekData.isMilestoneCompleted ? 'text-growth-400' : 'text-slate-500'}`} />
              <span>{activeWeekData.isMilestoneCompleted ? 'Milestone Done' : 'Mark Complete'}</span>
            </button>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs sm:text-sm text-slate-400">
            <span>Core curriculum focus: {activeWeekData.topics.length} key learning topics</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('roadmap')}
              className="text-xs sm:text-sm text-tech-300 hover:text-tech-200"
            >
              View Full Syllabus →
            </Button>
          </div>
        </Card>

        {/* Weekly Momentum Meter */}
        <Card className="p-6 sm:p-7 flex items-center justify-between gap-5" glow="growth">
          <div className="space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-growth-400 font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              Weekly Momentum
            </span>
            <div className="text-3xl font-bold font-mono text-white">
              {activeWeekSessions} <span className="text-sm font-normal text-slate-400">/ {SESSIONS_PER_WEEK} sessions</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              {activeWeekSessions >= SESSIONS_PER_WEEK
                ? 'Target achieved this week!'
                : `${SESSIONS_PER_WEEK - activeWeekSessions} more to hit the 5-session target`}
            </p>
          </div>

          <ProgressRing
            value={activeWeekSessions / SESSIONS_PER_WEEK}
            size={84}
            stroke={8}
            gradientId="momentum-ring"
            label="Weekly momentum progress"
            from="var(--color-tech-400)"
            to="var(--color-growth-400)"
          >
            <span className="font-mono text-sm font-bold text-white">{momentumPercent}%</span>
          </ProgressRing>
        </Card>
      </div>

      {/* 4. Task Picker & Focus Timer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Task Selector (Menu of Daily Options) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <span>Select Today's Objective</span>
              <span className="text-xs font-normal text-slate-400">
                ({completedOptions.size}/{activeWeekData.dailyOptions.length} done)
              </span>
            </h2>
            <span className="text-xs text-slate-400">Choose from menu or create custom</span>
          </div>

          <TaskPicker
            week={activeWeekData}
            completedIds={completedOptions}
            selected={selectedTask}
            onSelect={handleSelectTask}
          />
        </div>

        {/* Right Column: Focus Timer */}
        <div className="lg:col-span-5">
          <FocusTimer onCapture={handleTimerCapture} />
        </div>
      </div>

      {/* 5. Daily Logging Form */}
      <Card className="p-7 sm:p-8" glow="tech">
        <div className="mb-6 pb-4 border-b border-white/[0.08] flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Log Today's Deep Work</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">Record artifacts, learnings, blockers, and update streak immediately</p>
          </div>
          <span className="text-xs font-mono text-slate-300 bg-white/[0.05] px-3 py-1.5 rounded-xl border border-white/10">
            Auto-saves to browser
          </span>
        </div>

        <DailyLogForm
          values={formValues}
          onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
          onSubmit={handleSubmitLog}
          durationFlash={durationFlash}
          weekLabel={`Assigned to Week ${activeWeekData.weekNumber}: ${activeWeekData.title}`}
          maxDate="2027-12-31"
        />
      </Card>
    </div>
  );
}
