import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { initialSeedData } from '../data/seedData';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { daysUntilTarget, todayISO } from '../lib/date';
import { mergeStates, reconcileCurriculum, STORAGE_KEY, validateAppState } from '../lib/persistence';
import { calendarWeekNumber, computeStreak, findWeekForDate, generateId } from '../lib/stats';
import type { AppState, CompetencyStatus, DailyLog, WeekData } from '../types';

export type NewLogInput = Omit<DailyLog, 'id' | 'createdAt' | 'weekNumber'> & { weekNumber?: number };
export type LogPatch = Partial<Omit<DailyLog, 'id' | 'createdAt'>>;

interface AppContextValue {
  state: AppState;
  /** Local calendar date (YYYY-MM-DD); rolls over automatically at midnight. */
  today: string;
  activeWeekData: WeekData;
  calendarWeek: number;
  streak: number;
  daysRemaining: number;

  addLog: (input: NewLogInput) => DailyLog;
  updateLog: (id: string, patch: LogPatch) => void;
  deleteLog: (id: string) => DailyLog | undefined;
  restoreLog: (log: DailyLog) => void;
  toggleMilestone: (weekNumber: number) => void;
  toggleTopic: (weekNumber: number, topic: string) => void;
  toggleDeliverable: (capstoneId: string, deliverableId: string) => void;
  updateCapstoneLinks: (capstoneId: string, links: { repoUrl?: string; liveUrl?: string }) => void;
  updateCompetency: (id: string, status: CompetencyStatus) => void;
  setActiveWeek: (weekNumber: number) => void;
  weekForDate: (iso: string) => number;
  importState: (incoming: AppState, mode: 'replace' | 'merge') => void;
  resetToSeed: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const isAppState = (v: unknown): v is AppState => validateAppState(v).ok;

/** Deep clone and reconcile seed data with any existing state so JSON edits take effect immediately while preserving user logs. */
const freshSeed = (): AppState => {
  const seed = structuredClone(initialSeedData);
  try {
    const oldRaw = typeof window !== 'undefined'
      ? (window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem('fullstack_ascent_state'))
      : null;
    if (oldRaw) {
      const parsed = JSON.parse(oldRaw);
      if (parsed && typeof parsed === 'object') {
        return reconcileCurriculum(parsed as AppState, seed);
      }
    }
  } catch {
    /* fallback to clean seed */
  }
  return seed;
};

function useToday(): string {
  const [today, setToday] = useState(todayISO);
  useEffect(() => {
    const tick = () => setToday((prev) => {
      const now = todayISO();
      return now === prev ? prev : now;
    });
    const id = window.setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);
  return today;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState, resetStorage] = useLocalStorage<AppState>(STORAGE_KEY, freshSeed, { validate: isAppState });
  const today = useToday();

  const calendarWeek = useMemo(() => calendarWeekNumber(state.weeks, today), [state.weeks, today]);

  // On launch (and when the date rolls into a new program week) jump the cockpit to the current week.
  const lastSyncedWeek = useRef<number | null>(null);
  useEffect(() => {
    if (lastSyncedWeek.current === calendarWeek) return;
    lastSyncedWeek.current = calendarWeek;
    setState((s) => (s.activeWeek === calendarWeek ? s : { ...s, activeWeek: calendarWeek }));
  }, [calendarWeek, setState]);

  // Auto-sync with curriculum.json: whenever the user edits curriculum.json in code or git,
  // reconcile fresh curriculum definitions while preserving all user logs, checks, and URLs.
  useEffect(() => {
    setState((current) => {
      const synced = reconcileCurriculum(current, initialSeedData);
      // Fast equality check: if nothing changed in curriculum definitions, return current to prevent re-render
      if (
        JSON.stringify(current.weeks.map((w) => w.topics)) === JSON.stringify(synced.weeks.map((w) => w.topics)) &&
        JSON.stringify(current.weeks.map((w) => w.title)) === JSON.stringify(synced.weeks.map((w) => w.title)) &&
        JSON.stringify(current.weeks.map((w) => w.dailyOptions)) === JSON.stringify(synced.weeks.map((w) => w.dailyOptions)) &&
        JSON.stringify(current.weeks.map((w) => w.phase)) === JSON.stringify(synced.weeks.map((w) => w.phase)) &&
        current.weeks.length === synced.weeks.length
      ) {
        return current;
      }
      return synced;
    });
  }, [setState]);

  const weekForDate = useCallback(
    (iso: string) => findWeekForDate(state.weeks, iso)?.weekNumber ?? calendarWeekNumber(state.weeks, iso),
    [state.weeks],
  );

  const addLog = useCallback(
    (input: NewLogInput): DailyLog => {
      const log: DailyLog = {
        ...input,
        id: generateId('log'),
        weekNumber: input.weekNumber ?? weekForDate(input.date),
        durationHours: Math.max(0, Math.round(input.durationHours * 100) / 100),
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, logs: [...s.logs, log] }));
      return log;
    },
    [setState, weekForDate],
  );

  const updateLog = useCallback(
    (id: string, patch: LogPatch) => {
      setState((s) => ({
        ...s,
        logs: s.logs.map((l) => {
          if (l.id !== id) return l;
          const next = { ...l, ...patch };
          // Keep week assignment consistent when the date is edited.
          if (patch.date && patch.weekNumber === undefined) next.weekNumber = weekForDate(patch.date);
          return next;
        }),
      }));
    },
    [setState, weekForDate],
  );

  const deleteLog = useCallback(
    (id: string) => {
      let removed: DailyLog | undefined;
      setState((s) => {
        removed = s.logs.find((l) => l.id === id);
        return { ...s, logs: s.logs.filter((l) => l.id !== id) };
      });
      return removed;
    },
    [setState],
  );

  const restoreLog = useCallback(
    (log: DailyLog) => setState((s) => (s.logs.some((l) => l.id === log.id) ? s : { ...s, logs: [...s.logs, log] })),
    [setState],
  );

  const toggleMilestone = useCallback(
    (weekNumber: number) =>
      setState((s) => ({
        ...s,
        weeks: s.weeks.map((w) => (w.weekNumber === weekNumber ? { ...w, isMilestoneCompleted: !w.isMilestoneCompleted } : w)),
      })),
    [setState],
  );

  const toggleTopic = useCallback(
    (weekNumber: number, topic: string) =>
      setState((s) => ({
        ...s,
        weeks: s.weeks.map((w) => {
          if (w.weekNumber !== weekNumber) return w;
          const done = new Set(w.completedTopics ?? []);
          if (done.has(topic)) done.delete(topic);
          else done.add(topic);
          return { ...w, completedTopics: Array.from(done) };
        }),
      })),
    [setState],
  );

  const toggleDeliverable = useCallback(
    (capstoneId: string, deliverableId: string) =>
      setState((s) => ({
        ...s,
        capstones: s.capstones.map((c) =>
          c.id !== capstoneId
            ? c
            : { ...c, deliverables: c.deliverables.map((d) => (d.id === deliverableId ? { ...d, done: !d.done } : d)) },
        ),
      })),
    [setState],
  );

  const updateCapstoneLinks = useCallback(
    (capstoneId: string, links: { repoUrl?: string; liveUrl?: string }) =>
      setState((s) => ({
        ...s,
        capstones: s.capstones.map((c) => (c.id === capstoneId ? { ...c, ...links } : c)),
      })),
    [setState],
  );

  const updateCompetency = useCallback(
    (id: string, status: CompetencyStatus) =>
      setState((s) => ({
        ...s,
        competencies: s.competencies.map((c) => (c.id === id ? { ...c, status } : c)),
      })),
    [setState],
  );

  const setActiveWeek = useCallback(
    (weekNumber: number) =>
      setState((s) => {
        const max = Math.max(...s.weeks.map((w) => w.weekNumber));
        const min = Math.min(...s.weeks.map((w) => w.weekNumber));
        return { ...s, activeWeek: Math.min(max, Math.max(min, weekNumber)) };
      }),
    [setState],
  );

  const importState = useCallback(
    (incoming: AppState, mode: 'replace' | 'merge') =>
      setState((s) => (mode === 'replace' ? structuredClone(incoming) : mergeStates(s, incoming))),
    [setState],
  );

  const resetToSeed = useCallback(() => {
    resetStorage();
    lastSyncedWeek.current = null;
  }, [resetStorage]);

  const value = useMemo<AppContextValue>(() => {
    const activeWeekData =
      state.weeks.find((w) => w.weekNumber === state.activeWeek) ?? state.weeks[0];
    return {
      state,
      today,
      activeWeekData,
      calendarWeek,
      streak: computeStreak(state.logs, today),
      daysRemaining: daysUntilTarget(today),
      addLog,
      updateLog,
      deleteLog,
      restoreLog,
      toggleMilestone,
      toggleTopic,
      toggleDeliverable,
      updateCapstoneLinks,
      updateCompetency,
      setActiveWeek,
      weekForDate,
      importState,
      resetToSeed,
    };
  }, [
    state,
    today,
    calendarWeek,
    addLog,
    updateLog,
    deleteLog,
    restoreLog,
    toggleMilestone,
    toggleTopic,
    toggleDeliverable,
    updateCapstoneLinks,
    updateCompetency,
    setActiveWeek,
    weekForDate,
    importState,
    resetToSeed,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within <AppProvider>');
  return ctx;
}
