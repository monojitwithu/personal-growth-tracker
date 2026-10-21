import type { DailyLog, WeekData } from '../types';
import { addDays } from './date';

export const SESSIONS_PER_WEEK = 5;

/** A log keeps the streak alive if work was completed OR a deliberate rest day was logged. */
export function isStreakLog(log: DailyLog): boolean {
  return log.status === 'Completed' || log.status === 'Rest Day';
}

/** Week whose [startDate, endDate] window contains `iso`, or null if outside the program. */
export function findWeekForDate(weeks: WeekData[], iso: string): WeekData | null {
  return weeks.find((w) => iso >= w.startDate && iso <= w.endDate) ?? null;
}

/** Current program week, clamped to Week 1 before the program starts and the final week after it ends. */
export function calendarWeekNumber(weeks: WeekData[], iso: string): number {
  if (weeks.length === 0) return 1;
  const hit = findWeekForDate(weeks, iso);
  if (hit) return hit.weekNumber;
  const sorted = [...weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  return iso < sorted[0].startDate ? sorted[0].weekNumber : sorted[sorted.length - 1].weekNumber;
}

/**
 * Consecutive calendar days (ending today) with at least one streak-qualifying log.
 * If today has nothing logged yet, the streak is counted from yesterday so it doesn't
 * "break" at midnight before you've had a chance to work.
 */
export function computeStreak(logs: DailyLog[], today: string): number {
  const activeDays = new Set(logs.filter(isStreakLog).map((l) => l.date));
  let cursor = activeDays.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Completed deep-work sessions logged against a given week. */
export function weekSessionCount(logs: DailyLog[], weekNumber: number): number {
  return logs.filter((l) => l.weekNumber === weekNumber && l.status === 'Completed').length;
}

export function normalizeTitle(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** IDs of a week's curated options that have at least one Completed log (matched by title). */
export function completedOptionIds(week: WeekData, logs: DailyLog[]): Set<string> {
  const doneTitles = new Set(
    logs
      .filter((l) => l.weekNumber === week.weekNumber && l.status === 'Completed')
      .map((l) => normalizeTitle(l.taskTitle)),
  );
  return new Set(week.dailyOptions.filter((o) => doneTitles.has(normalizeTitle(o.title))).map((o) => o.id));
}

export function totalHours(logs: DailyLog[]): number {
  return Math.round(logs.reduce((sum, l) => sum + (Number.isFinite(l.durationHours) ? l.durationHours : 0), 0) * 100) / 100;
}

export function weekProgressPercent(week: WeekData, logs: DailyLog[]): number {
  return Math.min(100, Math.round((weekSessionCount(logs, week.weekNumber) / SESSIONS_PER_WEEK) * 100));
}

/** Splits "Phase 1: Backend & Relational Data Mastery" → { key: 'Phase 1', name: 'Backend & …' }. */
export function splitPhase(phase: string): { key: string; name: string } {
  const idx = phase.indexOf(':');
  if (idx === -1) return { key: phase, name: '' };
  return { key: phase.slice(0, idx).trim(), name: phase.slice(idx + 1).trim() };
}

export function generateId(prefix = 'log'): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

export interface BacklogItem {
  weekNumber: number;
  weekTitle: string;
  phase: string;
  type: 'topic' | 'milestone';
  title: string;
}

export interface ScheduleHealth {
  status: 'on-track' | 'delayed' | 'ahead';
  daysDelayed: number;
  backlogTopicsCount: number;
  backlogMilestonesCount: number;
  backlogItems: BacklogItem[];
  plannedTargetDate: string;
  projectedTargetDate: string;
  expectedCompletedWeeks: number;
  actualCompletedWeeks: number;
  completedTopicsCount: number;
  totalTopicsCount: number;
  summaryText: string;
}

export function computeScheduleHealth(weeks: WeekData[], today: string): ScheduleHealth {
  const plannedTargetDate = weeks[weeks.length - 1]?.endDate ?? '2027-02-02';
  const currentWeekNum = calendarWeekNumber(weeks, today);

  const backlogItems: BacklogItem[] = [];
  let backlogTopicsCount = 0;
  let backlogMilestonesCount = 0;
  let completedTopicsCount = 0;
  let totalTopicsCount = 0;
  let actualCompletedWeeks = 0;

  for (const week of weeks) {
    totalTopicsCount += week.topics.length;
    const doneTopicsSet = new Set(week.completedTopics ?? []);
    completedTopicsCount += doneTopicsSet.size;

    const isPastWeek = week.endDate < today;
    const isWeekFullyDone = week.isMilestoneCompleted && doneTopicsSet.size === week.topics.length;

    if (isWeekFullyDone) {
      actualCompletedWeeks += 1;
    }

    if (isPastWeek) {
      for (const topic of week.topics) {
        if (!doneTopicsSet.has(topic)) {
          backlogTopicsCount += 1;
          backlogItems.push({
            weekNumber: week.weekNumber,
            weekTitle: week.title,
            phase: week.phase,
            type: 'topic',
            title: topic,
          });
        }
      }

      if (!week.isMilestoneCompleted) {
        backlogMilestonesCount += 1;
        backlogItems.push({
          weekNumber: week.weekNumber,
          weekTitle: week.title,
          phase: week.phase,
          type: 'milestone',
          title: week.milestoneDeliverable,
        });
      }
    }
  }

  const expectedCompletedWeeks = Math.max(0, currentWeekNum - 1);

  let daysDelayed = 0;
  let status: 'on-track' | 'delayed' | 'ahead' = 'on-track';

  if (backlogItems.length > 0) {
    daysDelayed = Math.max(
      1,
      Math.round(backlogMilestonesCount * 2.5 + backlogTopicsCount * 0.75),
    );
    status = 'delayed';
  } else if (actualCompletedWeeks > expectedCompletedWeeks) {
    status = 'ahead';
  } else {
    status = 'on-track';
  }

  const projectedTargetDate = daysDelayed > 0 ? addDays(plannedTargetDate, daysDelayed) : plannedTargetDate;

  let summaryText = 'All past weekly objectives completed. You are on track!';
  if (status === 'delayed') {
    summaryText = `${backlogItems.length} backlog item${backlogItems.length === 1 ? '' : 's'} (${backlogTopicsCount} topic${backlogTopicsCount === 1 ? '' : 's'}, ${backlogMilestonesCount} milestone${backlogMilestonesCount === 1 ? '' : 's'}). Target estimated to slip by ${daysDelayed} day${daysDelayed === 1 ? '' : 's'}.`;
  } else if (status === 'ahead') {
    summaryText = `Pacing ahead of target timeline (${actualCompletedWeeks} of ${expectedCompletedWeeks} expected weeks finished).`;
  }

  return {
    status,
    daysDelayed,
    backlogTopicsCount,
    backlogMilestonesCount,
    backlogItems,
    plannedTargetDate,
    projectedTargetDate,
    expectedCompletedWeeks,
    actualCompletedWeeks,
    completedTopicsCount,
    totalTopicsCount,
    summaryText,
  };
}

