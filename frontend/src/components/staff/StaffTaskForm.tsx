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

  const handleSubmit = (e: React.FormEvent) => {
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
    createTask({
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

  return (
    <form onSubmit={handleSubmit} className="space-y-3 mb-5 pb-5 border-b border-gray-100">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={isAdmin ? 'Assign a new task…' : 'Add your task…'}
        className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-gray-400"
      />
      <div className={`grid gap-3 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {isAdmin && (
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none bg-white"
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
          className="border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none bg-white"
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
          className="border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none bg-white"
        />
      </div>
      <button
        type="submit"
        className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-2xl text-sm font-medium"
      >
        {isAdmin ? 'Assign task' : 'Add task'}
      </button>
    </form>
  );
}
