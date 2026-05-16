'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import StaffMonthlyAttendanceTable from '@/components/staff/StaffMonthlyAttendanceTable';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import {
  buildMonthlyReport,
  formatYearMonth,
  monthLabel,
  shiftYearMonth,
} from '@/lib/staffAttendance';
import { getStaffSession, getAttendance, getStaffMembersOnly } from '@/lib/staffAuth';

export default function StaffAttendancePage() {
  const router = useRouter();
  const session = getStaffSession();
  const isAdmin = session?.user.role === 'staff_admin';
  const [yearMonth, setYearMonth] = useState(() => formatYearMonth(new Date()));
  const [records, setRecords] = useState(() => getAttendance());

  useEffect(() => {
    if (!isAdmin) router.replace('/staff');
  }, [isAdmin, router]);

  useEffect(() => {
    const refresh = () => setRecords(getAttendance());
    refresh();
    const id = window.setInterval(refresh, 2000);
    return () => window.clearInterval(id);
  }, [yearMonth]);

  const staffMembers = getStaffMembersOnly();
  const staffIds = staffMembers.map((m) => m.id);

  const report = useMemo(
    () => buildMonthlyReport(records, staffIds, yearMonth),
    [records, staffIds, yearMonth]
  );

  const totals = useMemo(() => {
    return report.reduce(
      (acc, r) => ({
        present: acc.present + r.present,
        absent: acc.absent + r.absent,
        holiday: acc.holiday + r.holiday,
      }),
      { present: 0, absent: 0, holiday: 0 }
    );
  }, [report]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-5">
      <StaffPanel>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <StaffSectionTitle>Monthly attendance</StaffSectionTitle>
            <p className="text-sm text-gray-500 mt-1">{monthLabel(yearMonth)} · whole team</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYearMonth((m) => shiftYearMonth(m, -1))}
              className="w-10 h-10 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-gray-800 min-w-[120px] text-center">
              {monthLabel(yearMonth)}
            </span>
            <button
              type="button"
              onClick={() => setYearMonth((m) => shiftYearMonth(m, 1))}
              className="w-10 h-10 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-green-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-green-700">Present</p>
            <p className="text-xl font-bold text-green-800">{totals.present}</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-red-700">Absent</p>
            <p className="text-xl font-bold text-red-800">{totals.absent}</p>
          </div>
          <div className="bg-yellow-50 rounded-2xl p-3 text-center">
            <p className="text-xs text-yellow-700">Holiday</p>
            <p className="text-xl font-bold text-yellow-800">{totals.holiday}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 mb-2">
          Mark attendance from Team → Mark attendance. P = Present · A = Absent · H = Holiday
        </p>
        <StaffMonthlyAttendanceTable rows={report} yearMonth={yearMonth} variant="summary" />
      </StaffPanel>

      <StaffPanel>
        <StaffSectionTitle>Day-wise calendar</StaffSectionTitle>
        <p className="text-xs text-gray-500 mt-1 mb-4">Scroll horizontally to see each day</p>
        <StaffMonthlyAttendanceTable rows={report} yearMonth={yearMonth} variant="calendar" />
      </StaffPanel>
    </div>
  );
}
