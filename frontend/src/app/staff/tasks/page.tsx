'use client';

import { useMemo, useState } from 'react';
import StaffTaskForm from '@/components/staff/StaffTaskForm';
import StaffTasksTable from '@/components/staff/StaffTasksTable';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { getStaffSession, getTasks, reassignTask, updateTaskStatus } from '@/lib/staffAuth';
import type { TaskStatus } from '@/lib/staffMockData';

type Tab = 'all' | 'today' | 'upcoming' | 'done';

export default function StaffTasksPage() {
  const [tasks, setTasks] = useState(getTasks());
  const [tab, setTab] = useState<Tab>('all');
  const session = getStaffSession();
  const userId = session?.user.id ?? '';
  const isAdmin = session?.user.role === 'staff_admin';

  const reload = () => setTasks(getTasks());
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = isAdmin ? tasks : tasks.filter((t) => t.assigneeId === userId);
    if (tab === 'today') list = list.filter((t) => t.scheduledDate === today);
    if (tab === 'upcoming') list = list.filter((t) => t.scheduledDate > today);
    if (tab === 'done') list = list.filter((t) => t.status === 'done');
    return list.sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
  }, [tasks, tab, today, userId, isAdmin]);

  const handleStatusChange = (id: string, status: TaskStatus) => {
    if (updateTaskStatus(id, status)) reload();
  };

  const handleReassign = (id: string, assigneeId: string) => {
    if (reassignTask(id, assigneeId)) reload();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'done', label: 'Done' },
  ];

  return (
    <StaffPanel>
      <StaffTaskForm
        createdById={userId}
        defaultAssigneeId={isAdmin ? undefined : userId}
        isAdmin={isAdmin}
        onCreated={reload}
      />
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              tab === t.id ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 border border-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <StaffSectionTitle>{isAdmin ? 'All team tasks' : 'My tasks'}</StaffSectionTitle>
      <p className="text-xs text-gray-500 mt-1 mb-3">
        Tasks created by admin or staff appear here for everyone with access.
      </p>
      <StaffTasksTable
        tasks={filtered}
        onStatusChange={handleStatusChange}
        onReassign={isAdmin ? handleReassign : undefined}
        allowReassign={isAdmin}
        showAssignee={isAdmin}
        showCreatedBy
      />
    </StaffPanel>
  );
}
