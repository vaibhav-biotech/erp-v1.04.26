'use client';

import { useState } from 'react';
import { createTask, getActiveStaffMembers } from '@/lib/staffAuth';
import { WORK_TYPE_LABELS, type WorkType } from '@/lib/staffMockData';

interface StaffTaskFormProps {
  createdById: string;
  defaultAssigneeId?: string;
  isAdmin: boolean;
  onCreated?: () => void;
}

export default function StaffTaskForm({
  createdById,
  defaultAssigneeId,
  isAdmin,
  onCreated,
}: StaffTaskFormProps) {
  const staffList = getActiveStaffMembers();
  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState(defaultAssigneeId || staffList[0]?.id || '');
  const [workType, setWorkType] = useState<WorkType>('whatsapp');
  const [scheduledDate, setScheduledDate] = useState(today);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    const assignee = isAdmin ? assigneeId : createdById;
    if (!assignee) {
      setError('No staff member to assign');
      return;
    }
    await createTask({
      title,
      assigneeId: assignee,
      workType,
      scheduledDate,
      createdById,
    });
    setTitle('');
    setScheduledDate(today);
    setError('');
    onCreated?.();
  };

  const fieldClass =
    'h-11 border border-gray-200 rounded-2xl px-3 text-sm outline-none bg-white focus:ring-2 focus:ring-gray-400 shrink-0';

  return (
    <form onSubmit={handleSubmit} className="mb-5 pb-5 border-b border-gray-100 space-y-2">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
      <div className="flex flex-nowrap gap-2 items-center overflow-x-auto pb-0.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={isAdmin ? 'Assign a new task…' : 'Add your task…'}
          className={`${fieldClass} flex-1 min-w-[10rem] max-w-none`}
        />
        {isAdmin && (
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className={`${fieldClass} w-36`}
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value as WorkType)}
          className={`${fieldClass} w-32`}
        >
          {(Object.keys(WORK_TYPE_LABELS) as WorkType[]).map((k) => (
            <option key={k} value={k}>
              {WORK_TYPE_LABELS[k]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={scheduledDate}
          onChange={(e) => setScheduledDate(e.target.value)}
          className={`${fieldClass} w-[9.5rem]`}
        />
        <button
          type="submit"
          className="h-11 shrink-0 whitespace-nowrap bg-gray-900 hover:bg-gray-800 text-white px-5 rounded-2xl text-sm font-medium"
        >
          {isAdmin ? 'Assign task' : 'Add task'}
        </button>
      </div>
    </form>
  );
}
