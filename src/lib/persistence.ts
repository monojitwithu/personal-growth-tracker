import type {
  AppState,
  CapstoneProject,
  CompetencyItem,
  CompetencyStatus,
  DailyLog,
  FocusMode,
  LogStatus,
  WeekData,
} from '../types';
import { isValidISODate } from './date';

export const STORAGE_KEY = 'fullstack_ascent_state_v3';
export const BACKUP_APP_ID = 'fullstack-ascent';
export const BACKUP_VERSION = 1;

export const FOCUS_MODES: readonly FocusMode[] = ['Mode A', 'Mode B', 'Mode C', 'Buffer/Rest'];
export const LOG_STATUSES: readonly LogStatus[] = ['Completed', 'In Progress', 'Rest Day'];
export const COMPETENCY_STATUSES: readonly CompetencyStatus[] = ['Not Started', 'In Progress', 'Production Ready'];

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  state: AppState;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function checkWeek(w: unknown, i: number): string | null {
  if (!isObj(w)) return `weeks[${i}] is not an object`;
  if (typeof w.weekNumber !== 'number') return `weeks[${i}].weekNumber must be a number`;
  for (const k of ['dateRange', 'startDate', 'endDate', 'phase', 'title', 'milestoneDeliverable'] as const) {
    if (!isStr(w[k])) return `weeks[${i}].${k} must be a string`;
  }
  if (!isValidISODate(w.startDate) || !isValidISODate(w.endDate)) return `weeks[${i}] has invalid start/end dates`;
  if (!isStrArr(w.topics)) return `weeks[${i}].topics must be a string array`;
  if (typeof w.isMilestoneCompleted !== 'boolean') return `weeks[${i}].isMilestoneCompleted must be boolean`;
  if (w.completedTopics !== undefined && !isStrArr(w.completedTopics)) return `weeks[${i}].completedTopics invalid`;
  if (!Array.isArray(w.dailyOptions)) return `weeks[${i}].dailyOptions must be an array`;
  for (const [j, o] of w.dailyOptions.entries()) {
    if (!isObj(o) || !isStr(o.id) || !isStr(o.title) || !isStr(o.description) || !FOCUS_MODES.includes(o.mode as FocusMode)) {
      return `weeks[${i}].dailyOptions[${j}] is malformed`;
    }
  }
  return null;
}

function checkLog(l: unknown, i: number): string | null {
  if (!isObj(l)) return `logs[${i}] is not an object`;
  if (!isStr(l.id) || !l.id) return `logs[${i}].id missing`;
  if (!isValidISODate(l.date)) return `logs[${i}].date must be YYYY-MM-DD`;
  if (typeof l.weekNumber !== 'number') return `logs[${i}].weekNumber must be a number`;
  if (!FOCUS_MODES.includes(l.mode as FocusMode)) return `logs[${i}].mode is invalid`;
  if (!isStr(l.taskTitle)) return `logs[${i}].taskTitle must be a string`;
  if (typeof l.durationHours !== 'number' || l.durationHours < 0) return `logs[${i}].durationHours invalid`;
  if (!isStr(l.outputArtifact) || !isStr(l.notesAndBlockers) || !isStr(l.createdAt)) return `logs[${i}] has invalid text fields`;
  if (!LOG_STATUSES.includes(l.status as LogStatus)) return `logs[${i}].status is invalid`;
  return null;
}

function checkCapstone(c: unknown, i: number): string | null {
  if (!isObj(c) || !isStr(c.id) || !isStr(c.title) || !isStr(c.description) || !isStrArr(c.stack)) {
    return `capstones[${i}] is malformed`;
  }
  if (!Array.isArray(c.deliverables)) return `capstones[${i}].deliverables must be an array`;
  for (const d of c.deliverables) {
    if (!isObj(d) || !isStr(d.id) || !isStr(d.text) || typeof d.done !== 'boolean') return `capstones[${i}] deliverable malformed`;
  }
  if (c.repoUrl !== undefined && !isStr(c.repoUrl)) return `capstones[${i}].repoUrl invalid`;
  if (c.liveUrl !== undefined && !isStr(c.liveUrl)) return `capstones[${i}].liveUrl invalid`;
  return null;
}

function checkCompetency(c: unknown, i: number): string | null {
  if (!isObj(c) || !isStr(c.id) || !isStr(c.title) || !isStr(c.benchmark)) return `competencies[${i}] is malformed`;
  if (!COMPETENCY_STATUSES.includes(c.status as CompetencyStatus)) return `competencies[${i}].status is invalid`;
  return null;
}

/** Structural validation of a full AppState. */
export function validateAppState(raw: unknown): Result<AppState> {
  if (!isObj(raw)) return { ok: false, error: 'Root must be an object.' };
  const { weeks, logs, capstones, competencies, activeWeek } = raw;
  if (!Array.isArray(weeks) || weeks.length === 0) return { ok: false, error: '`weeks` must be a non-empty array.' };
  if (!Array.isArray(logs)) return { ok: false, error: '`logs` must be an array.' };
  if (!Array.isArray(capstones)) return { ok: false, error: '`capstones` must be an array.' };
  if (!Array.isArray(competencies)) return { ok: false, error: '`competencies` must be an array.' };
  if (typeof activeWeek !== 'number') return { ok: false, error: '`activeWeek` must be a number.' };

  const checks: (string | null)[] = [
    ...weeks.map(checkWeek),
    ...logs.map(checkLog),
    ...capstones.map(checkCapstone),
    ...competencies.map(checkCompetency),
  ];
  const firstError = checks.find((e) => e !== null);
  if (firstError) return { ok: false, error: firstError };
  return { ok: true, value: raw as unknown as AppState };
}

/** Accepts either a wrapped BackupFile or a bare AppState JSON. */
export function parseBackup(text: string): Result<AppState> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: 'File is not valid JSON.' };
  }
  if (isObj(json) && 'state' in json) {
    if (json.app !== undefined && json.app !== BACKUP_APP_ID) {
      return { ok: false, error: `Unrecognised backup source "${String(json.app)}".` };
    }
    return validateAppState(json.state);
  }
  return validateAppState(json);
}

export function createBackup(state: AppState): BackupFile {
  return { app: BACKUP_APP_ID, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), state };
}

const competencyRank: Record<CompetencyStatus, number> = { 'Not Started': 0, 'In Progress': 1, 'Production Ready': 2 };

/**
 * Non-destructive merge: union of logs by id (incoming wins on conflict), progress flags OR-ed,
 * competency takes the more advanced rating, URLs prefer incoming when present.
 */
export function mergeStates(current: AppState, incoming: AppState): AppState {
  const logMap = new Map<string, DailyLog>(current.logs.map((l) => [l.id, l]));
  incoming.logs.forEach((l) => logMap.set(l.id, l));

  const incomingWeeks = new Map(incoming.weeks.map((w) => [w.weekNumber, w]));
  const weeks: WeekData[] = current.weeks.map((w) => {
    const other = incomingWeeks.get(w.weekNumber);
    if (!other) return w;
    return {
      ...w,
      isMilestoneCompleted: w.isMilestoneCompleted || other.isMilestoneCompleted,
      completedTopics: Array.from(new Set([...(w.completedTopics ?? []), ...(other.completedTopics ?? [])])),
    };
  });
  incoming.weeks.forEach((w) => {
    if (!weeks.some((x) => x.weekNumber === w.weekNumber)) weeks.push(w);
  });

  const incomingCaps = new Map(incoming.capstones.map((c) => [c.id, c]));
  const capstones: CapstoneProject[] = current.capstones.map((c) => {
    const other = incomingCaps.get(c.id);
    if (!other) return c;
    const otherDone = new Map(other.deliverables.map((d) => [d.id, d.done]));
    return {
      ...c,
      repoUrl: other.repoUrl || c.repoUrl,
      liveUrl: other.liveUrl || c.liveUrl,
      deliverables: c.deliverables.map((d) => ({ ...d, done: d.done || otherDone.get(d.id) === true })),
    };
  });
  incoming.capstones.forEach((c) => {
    if (!capstones.some((x) => x.id === c.id)) capstones.push(c);
  });

  const incomingComps = new Map(incoming.competencies.map((c) => [c.id, c]));
  const competencies: CompetencyItem[] = current.competencies.map((c) => {
    const other = incomingComps.get(c.id);
    if (!other) return c;
    return competencyRank[other.status] > competencyRank[c.status] ? { ...c, status: other.status } : c;
  });

  return {
    ...current,
    weeks: weeks.sort((a, b) => a.weekNumber - b.weekNumber),
    logs: Array.from(logMap.values()),
    capstones,
    competencies,
  };
}

/**
 * Reconciles persisted user state with the canonical curriculum from JSON.
 * - Always adopts latest curriculum definitions (titles, phases, topics, daily options, deliverables).
 * - Faithfully preserves user progress (completed topics, milestone completion flags, logged sessions, capstone checkmarks, competency ratings).
 */
export function reconcileCurriculum(persisted: AppState, canonical: AppState): AppState {
  const persistedWeeks = new Map(persisted.weeks.map((w) => [w.weekNumber, w]));

  const weeks: WeekData[] = canonical.weeks.map((cWeek) => {
    const pWeek = persistedWeeks.get(cWeek.weekNumber);
    if (!pWeek) return cWeek;

    // Retain completed topics that match or still exist
    const completedTopics = (pWeek.completedTopics ?? []).filter((t) => cWeek.topics.includes(t));

    return {
      ...cWeek,
      isMilestoneCompleted: Boolean(pWeek.isMilestoneCompleted),
      completedTopics,
    };
  });

  const persistedCaps = new Map(persisted.capstones.map((c) => [c.id, c]));
  const capstones: CapstoneProject[] = canonical.capstones.map((cCap) => {
    const pCap = persistedCaps.get(cCap.id);
    if (!pCap) return cCap;

    const pDoneMap = new Map(pCap.deliverables.map((d) => [d.id, d.done]));
    return {
      ...cCap,
      repoUrl: pCap.repoUrl || cCap.repoUrl,
      liveUrl: pCap.liveUrl || cCap.liveUrl,
      deliverables: cCap.deliverables.map((d) => ({
        ...d,
        done: Boolean(pDoneMap.get(d.id)),
      })),
    };
  });

  const persistedComps = new Map(persisted.competencies.map((c) => [c.id, c]));
  const competencies: CompetencyItem[] = canonical.competencies.map((cComp) => {
    const pComp = persistedComps.get(cComp.id);
    return {
      ...cComp,
      status: pComp?.status ?? cComp.status,
    };
  });

  return {
    ...persisted,
    activeWeek: persisted.activeWeek || canonical.activeWeek || 1,
    weeks,
    capstones,
    competencies,
    logs: persisted.logs || [],
  };
}

