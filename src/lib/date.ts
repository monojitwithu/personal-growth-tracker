/**
 * Date helpers. All "ISO dates" here are LOCAL calendar dates in `YYYY-MM-DD` form —
 * never UTC — so a log written at 11:30 PM IST lands on the right day.
 */

export const TARGET_DATE_ISO = '2027-02-02';
const MS_PER_DAY = 86_400_000;

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Parses `YYYY-MM-DD` into a Date at local midnight. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, n: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

/** Whole calendar days from `a` to `b` (b - a). DST-safe via Math.round. */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / MS_PER_DAY);
}

export function daysUntilTarget(today: string, target: string = TARGET_DATE_ISO): number {
  return Math.max(0, daysBetween(today, target));
}

export function isValidISODate(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return toISODate(parseISODate(s)) === s;
}

const longFmt = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const shortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

export function formatLongDate(iso: string): string {
  return longFmt.format(parseISODate(iso));
}

export function formatShortDate(iso: string): string {
  return shortFmt.format(parseISODate(iso));
}

export function formatWeekday(iso: string): string {
  return weekdayFmt.format(parseISODate(iso));
}

/** `5025000` → `1:23:45`, `65000` → `01:05`. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function formatHours(h: number): string {
  const rounded = Math.round(h * 100) / 100;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toString()}h`;
}
