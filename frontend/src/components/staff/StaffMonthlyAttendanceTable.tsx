'use client';

import { getStaffMemberById } from '@/lib/staffAuth';
import {
  attendanceCellClass,
  attendanceMark,
  daysInMonth,
  type StaffMonthStats,
} from '@/lib/staffAttendance';

interface StaffMonthlyAttendanceTableProps {
  rows: StaffMonthStats[];
  yearMonth: string;
  variant: 'summary' | 'calendar';
}

export default function StaffMonthlyAttendanceTable({
  rows,
  yearMonth,
  variant,
}: StaffMonthlyAttendanceTableProps) {
  const dayCount = daysInMonth(yearMonth);

  if (rows.length === 0) {
    return <p className="text-center text-gray-500 py-8 text-sm">No staff members found.</p>;
  }

  if (variant === 'summary') {
    return (
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm text-left min-w-[520px]">
          <thead>
            <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
              <th className="py-3 px-2 font-medium">Staff</th>
              <th className="py-3 px-2 font-medium text-center">Present</th>
              <th className="py-3 px-2 font-medium text-center">Absent</th>
              <th className="py-3 px-2 font-medium text-center">Holiday</th>
              <th className="py-3 px-2 font-medium text-center">Marked</th>
              <th className="py-3 px-2 font-medium text-center">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => {
              const member = getStaffMemberById(row.staffId);
              return (
                <tr key={row.staffId} className="hover:bg-gray-50/80">
                  <td className="py-3 px-2 font-medium text-gray-900">{member?.name ?? '—'}</td>
                  <td className="py-3 px-2 text-center text-green-700 font-semibold">{row.present}</td>
                  <td className="py-3 px-2 text-center text-red-600 font-semibold">{row.absent}</td>
                  <td className="py-3 px-2 text-center text-yellow-700 font-semibold">{row.holiday}</td>
                  <td className="py-3 px-2 text-center text-gray-600">{row.total}</td>
                  <td className="py-3 px-2 text-center">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        row.rate >= 80
                          ? 'bg-green-100 text-green-700'
                          : row.rate >= 50
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {row.total > 0 ? `${row.rate}%` : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm text-left min-w-[720px]">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase">
            <th className="py-3 px-2 font-medium sticky left-0 bg-white z-10">Staff</th>
            {Array.from({ length: dayCount }, (_, i) => (
              <th key={i + 1} className="py-2 px-1 font-medium text-center w-8">
                {i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row) => {
            const member = getStaffMemberById(row.staffId);
            return (
              <tr key={row.staffId}>
                <td className="py-2 px-2 font-medium text-gray-900 whitespace-nowrap sticky left-0 bg-white z-10">
                  {member?.name ?? '—'}
                </td>
                {Array.from({ length: dayCount }, (_, i) => {
                  const day = i + 1;
                  const status = row.byDay[day];
                  return (
                    <td key={day} className="py-1 px-0.5 text-center">
                      <span
                        className={`inline-flex w-7 h-7 items-center justify-center rounded-lg text-[10px] font-bold ${attendanceCellClass(status)}`}
                      >
                        {status ? attendanceMark(status) : '·'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
