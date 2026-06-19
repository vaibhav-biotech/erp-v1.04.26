'use client';

import { useMemo } from 'react';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { getStaffSession, getTasks, getStaffMembersOnly } from '@/lib/staffAuth';
import { getCallLogs } from '@/lib/staffContacts';

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
  const calls = getCallLogs();
  const staffMembers = getStaffMembersOnly();

  const myTasks = useMemo(() => {
    return tasks.filter((t) => t.assigneeId === userId);
  }, [tasks, userId]);

  const completedTasks = myTasks.filter((t) => t.status === 'done').length;
  const pendingTasks = myTasks.filter((t) => t.status !== 'done').length;

  const myCalls = calls.filter((c) => c.staffId === userId);
  const totalCalls = myCalls.length;
  const convertedCalls = myCalls.filter(c => c.outcome === 'create_order' || c.outcome === 'interested').length;

  // Leaderboard for Staff Admin
  const leaderboard = useMemo(() => {
    if (session?.user.role !== 'staff_admin') return [];
    
    return staffMembers.map(staff => {
      const staffTasks = tasks.filter(t => t.assigneeId === staff.id);
      const staffCalls = calls.filter(c => c.staffId === staff.id);
      
      const doneTasks = staffTasks.filter(t => t.status === 'done').length;
      const convCalls = staffCalls.filter(c => c.outcome === 'create_order' || c.outcome === 'interested').length;
      
      return {
        id: staff.id,
        name: staff.name,
        totalTasks: staffTasks.length,
        doneTasks,
        totalCalls: staffCalls.length,
        convCalls,
        rate: staffTasks.length > 0 ? (doneTasks / staffTasks.length) * 100 : 0
      };
    }).sort((a, b) => b.doneTasks - a.doneTasks);
  }, [session, staffMembers, tasks, calls]);

  return (
    <StaffPanel>
      <StaffSectionTitle>My Daily Report</StaffSectionTitle>
      <div className="space-y-4 text-sm mt-5">
        <ReportRow label="Tasks Completed" value={`${completedTasks} / ${myTasks.length}`} />
        <ReportRow label="Pending Tasks" value={pendingTasks} />
        <ReportRow label="Total Calls Made" value={totalCalls} />
        <ReportRow label="Contacts Converted" value={`${convertedCalls} (Lead / Order)`} />
      </div>

      {session?.user.role === 'staff_admin' && (
        <div className="mt-10">
          <StaffSectionTitle>Team Performance</StaffSectionTitle>
          <div className="mt-4 border rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="py-3 px-4 font-medium">Team Member</th>
                  <th className="py-3 px-4 font-medium text-center">Tasks</th>
                  <th className="py-3 px-4 font-medium text-center">Calls</th>
                  <th className="py-3 px-4 font-medium text-center">Perf</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leaderboard.map(staff => {
                  let colorClass = 'bg-red-500';
                  if (staff.rate >= 80) colorClass = 'bg-green-500';
                  else if (staff.rate >= 50) colorClass = 'bg-yellow-500';

                  return (
                    <tr key={staff.id}>
                      <td className="py-3 px-4">{staff.name}</td>
                      <td className="py-3 px-4 text-center font-medium">{staff.doneTasks} / {staff.totalTasks}</td>
                      <td className="py-3 px-4 text-center font-medium">{staff.convCalls} / {staff.totalCalls}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                            <div className={`${colorClass} h-1.5 rounded-full`} style={{ width: `${staff.rate}%` }}></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
