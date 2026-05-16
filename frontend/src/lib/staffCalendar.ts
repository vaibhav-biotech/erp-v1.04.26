import { parseYearMonth } from './staffAttendance';

/** Calendar grid cells: null = empty pad, number = day of month */
export function getCalendarCells(yearMonth: string): (number | null)[] {
  const { year, month } = parseYearMonth(yearMonth);
  const startPad = new Date(year, month - 1, 1).getDay();
  const dayCount = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= dayCount; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function dateFromDay(yearMonth: string, day: number) {
  return `${yearMonth}-${String(day).padStart(2, '0')}`;
}

export function todayInMonth(yearMonth: string) {
  const today = new Date().toISOString().slice(0, 10);
  return today.startsWith(yearMonth) ? parseInt(today.slice(8), 10) : null;
}
