'use client';

import { useMemo } from 'react';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { getStaffSession, getTasks } from '@/lib/staffAuth';

function ReportRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function StaffReportsPage() {
  const session = getStaffSession();
  const userId = session?.user.id;
  const tasks = getTasks();

  const myTasks = useMemo(() => {
    if (session?.user.role === 'staff_admin') return tasks;
    return tasks.filter((t) => t.assigneeId === userId);
  }, [tasks, userId, session]);

  const completed = myTasks.filter((t) => t.status === 'done').length;
  const pending = myTasks.filter((t) => t.status !== 'done').length;

  return (
    <StaffPanel>
      <StaffSectionTitle>Daily Report</StaffSectionTitle>
      <div className="space-y-4 text-sm mt-5">
        <ReportRow label="Tasks Completed" value={completed} />
        <ReportRow label="Broadcasts Sent" value="320" />
        <ReportRow label="Leads Generated" value="18" />
        <ReportRow label="Pending Tasks" value={pending} />
      </div>
      <button
        type="button"
        onClick={() => alert('PDF report generated successfully')}
        className="w-full mt-6 bg-black text-white py-3 rounded-2xl font-medium"
      >
        Export PDF Report
      </button>
    </StaffPanel>
  );
}
