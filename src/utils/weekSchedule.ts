// Shared week/day <-> real-calendar-date math for the Weekly Content Planner.
// The planner shows a fixed 4-week grid per month, Monday-first. "Week 1" is
// anchored to the Monday on/before the 1st of the month, so day-of-week
// column headers always line up with real calendar weekdays (instead of
// naively treating day (week-1)*7+1 as "day 1 of week 1", which drifts off
// the actual weekday whenever the 1st isn't a Monday).

export const WEEKDAY_NAMES_MON_FIRST = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

export function getWeekAnchorMonday(year: number, monthIndex: number): Date {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const jsDay = firstOfMonth.getDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (jsDay + 6) % 7;
  return new Date(year, monthIndex, 1 - daysSinceMonday);
}

export function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Real calendar date for a given week number (1-4) / Monday-first day name,
// relative to the displayed month's grid.
export function computeDateForWeekDay(year: number, monthIndex: number, weekNum: number, dayName: string): string {
  const anchor = getWeekAnchorMonday(year, monthIndex);
  const dayIdx = WEEKDAY_NAMES_MON_FIRST.indexOf(dayName);
  const safeOffset = dayIdx >= 0 ? dayIdx : 0;
  const target = new Date(anchor);
  target.setDate(anchor.getDate() + (weekNum - 1) * 7 + safeOffset);
  return formatDateYMD(target);
}

// How many Monday-first week rows are needed to cover every day of the given
// month (varies by which weekday the 1st falls on and month length: 4, 5, or 6).
export function getWeeksInMonth(year: number, monthIndex: number): number {
  const anchor = getWeekAnchorMonday(year, monthIndex);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);
  const diffDays = Math.round((lastDayOfMonth.getTime() - anchor.getTime()) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

// Inverse: given a real date string, which week (1-6) and day name does it
// fall into within its own month's grid.
export function computeWeekDayForDate(
  dateStr: string
): { year: number; monthIndex: number; weekNumber: number; dayOfWeek: string } | null {
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const monthIndex = d.getMonth();
  const anchor = getWeekAnchorMonday(year, monthIndex);
  const diffDays = Math.round((d.getTime() - anchor.getTime()) / 86400000);
  const weekNumber = Math.floor(diffDays / 7) + 1;
  const dayOfWeek = WEEKDAY_NAMES_MON_FIRST[((diffDays % 7) + 7) % 7];
  return { year, monthIndex, weekNumber, dayOfWeek };
}
