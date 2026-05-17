'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import StaffStatCard from '@/components/staff/StaffStatCard';
import StaffTasksTable from '@/components/staff/StaffTasksTable';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { getStaffSession, getTasks, reassignTask, saveTasks } from '@/lib/staffAuth';
import type { TaskStatus } from '@/lib/staffMockData';

export default function StaffDashboardPage() {
  const [tasks, setTasks] = useState(getTasks());
  const session = getStaffSession();
  const userId = session?.user.id;
  const isAdmin = session?.user.role === 'staff_admin';

  const myTasks = useMemo(() => {
    if (isAdmin) return tasks;
    return tasks.filter((t) => t.assigneeId === userId);
  }, [tasks, userId, isAdmin]);

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = myTasks.filter((t) => t.scheduledDate === today);
  const doneToday = todayTasks.filter((t) => t.status === 'done').length;
  const pendingToday = todayTasks.filter((t) => t.status !== 'done').length;

  const handleStatusChange = (id: string, status: TaskStatus) => {
    const next = tasks.map((t) => (t.id === id ? { ...t, status } : t));
    setTasks(next);
    saveTasks(next);
  };

  const handleReassign = (id: string, assigneeId: string) => {
    if (reassignTask(id, assigneeId)) setTasks(getTasks());
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StaffStatCard label="Completed" value={doneToday} />
        <StaffStatCard label="Pending" value={pendingToday} />
        <StaffStatCard label="Today" value={todayTasks.length} />
        <StaffStatCard label="Total" value={myTasks.length} />
      </div>

      <StaffPanel>
        <div className="flex items-center justify-between mb-4">
          <StaffSectionTitle>{isAdmin ? 'All tasks today' : "Today's tasks"}</StaffSectionTitle>
          <Link href="/staff/tasks" className="text-sm font-medium text-gray-900 hover:underline">
            View all
          </Link>
        </div>
        <StaffTasksTable
          tasks={todayTasks}
          onStatusChange={handleStatusChange}
          onReassign={isAdmin ? handleReassign : undefined}
          allowReassign={isAdmin}
          showAssignee={isAdmin}
          showCreatedBy={isAdmin}
        />
      </StaffPanel>

      <Link href="/staff/contacts" className="block">
        <StaffPanel className="hover:border-gray-300 transition-colors">
          <p className="font-semibold text-gray-900">Call list</p>
          <p className="text-sm text-gray-500 mt-1">Log calls & view contact history</p>
        </StaffPanel>
      </Link>

      {isAdmin && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/staff/team" className="block">
            <StaffPanel className="hover:border-gray-300 transition-colors">
              <p className="font-semibold text-gray-900">Create staff</p>
              <p className="text-sm text-gray-500 mt-1">Username, password & roles</p>
            </StaffPanel>
          </Link>
          <Link href="/staff/attendance" className="block">
            <StaffPanel className="hover:border-gray-300 transition-colors">
              <p className="font-semibold text-gray-900">Attendance report</p>
              <p className="text-sm text-gray-500 mt-1">Monthly team overview</p>
            </StaffPanel>
          </Link>
        </div>
      )}
    </>
  );
}
