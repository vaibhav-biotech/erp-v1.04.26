import type { AttendanceStatus, StaffAttendance } from './staffMockData';

export function formatYearMonth(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function parseYearMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return { year: y, month: m };
}

export function shiftYearMonth(ym: string, delta: number) {
  const { year, month } = parseYearMonth(ym);
  const d = new Date(year, month - 1 + delta, 1);
  return formatYearMonth(d);
}

export function monthLabel(ym: string) {
  const { year, month } = parseYearMonth(ym);
  return new Date(year, month - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
}

export function daysInMonth(ym: string) {
  const { year, month } = parseYearMonth(ym);
  return new Date(year, month, 0).getDate();
}

export function attendanceMark(status: AttendanceStatus) {
  if (status === 'present') return 'P';
  if (status === 'absent') return 'A';
  return 'H';
}

export function attendanceCellClass(status?: AttendanceStatus) {
  if (status === 'present') return 'bg-green-100 text-green-700';
  if (status === 'absent') return 'bg-red-100 text-red-700';
  if (status) return 'bg-yellow-100 text-yellow-700';
  return 'bg-gray-50 text-gray-400';
}

/** Bright P / A / H colours for calendar day cells */
export function attendanceDayClass(status?: AttendanceStatus) {
  if (status === 'present') return 'bg-green-500 text-white border-green-500';
  if (status === 'absent') return 'bg-red-500 text-white border-red-500';
  if (status === 'holiday' || status === 'leave' || status === 'half_day') {
    return 'bg-yellow-400 text-yellow-950 border-yellow-400';
  }
  return 'bg-gray-50 text-gray-500 border-gray-100';
}

export interface StaffMonthStats {
  staffId: string;
  present: number;
  absent: number;
  holiday: number;
  total: number;
  rate: number;
  byDay: Record<number, AttendanceStatus | undefined>;
}

export function buildMonthlyReport(
  records: StaffAttendance[],
  staffIds: string[],
  yearMonth: string
): StaffMonthStats[] {
  const monthRecords = records.filter((r) => r.date.startsWith(yearMonth));
  const dayCount = daysInMonth(yearMonth);

  return staffIds.map((staffId) => {
    const mine = monthRecords.filter((r) => r.staffId === staffId);
    const present = mine.filter((r) => r.status === 'present').length;
    const absent = mine.filter((r) => r.status === 'absent').length;
    const holiday = mine.filter(
      (r) => r.status === 'holiday' || r.status === 'leave' || r.status === 'half_day'
    ).length;
    const total = mine.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    const byDay: Record<number, AttendanceStatus | undefined> = {};
    for (let d = 1; d <= dayCount; d++) {
      const date = `${yearMonth}-${String(d).padStart(2, '0')}`;
      byDay[d] = mine.find((r) => r.date === date)?.status;
    }

    return { staffId, present, absent, holiday, total, rate, byDay };
  });
}
