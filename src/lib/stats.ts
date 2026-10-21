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
