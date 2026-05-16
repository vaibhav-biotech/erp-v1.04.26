'use client';

import {
  TASK_STATUS_LABELS,
  WORK_TYPE_LABELS,
  type StaffTask,
  type TaskStatus,
} from '@/lib/staffMockData';

interface StaffTaskCardProps {
  task: StaffTask;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onTapToggle?: (id: string) => void;
  showAssignee?: boolean;
  assigneeName?: string;
}

const statusClass: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
};

export default function StaffTaskCard({
  task,
  onStatusChange,
  onTapToggle,
  showAssignee,
  assigneeName,
}: StaffTaskCardProps) {
  const interactive = Boolean(onTapToggle || onStatusChange);

  return (
    <article
      onClick={onTapToggle ? () => onTapToggle(task.id) : undefined}
      className={`border border-gray-100 rounded-2xl p-4 bg-white ${
        interactive ? 'cursor-pointer active:scale-[0.98] transition' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-gray-900">{task.title}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {task.scheduledDate === new Date().toISOString().slice(0, 10) ? 'Today' : task.scheduledDate}
            {task.scheduledTime ? ` · ${task.scheduledTime}` : ''}
          </p>
          <p className="text-xs text-green-700 mt-1">{WORK_TYPE_LABELS[task.workType]}</p>
          {showAssignee && assigneeName && (
            <p className="text-xs text-gray-400 mt-1">Assigned: {assigneeName}</p>
          )}
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${statusClass[task.status]}`}>
          {TASK_STATUS_LABELS[task.status]}
        </span>
      </div>
      {onStatusChange && !onTapToggle && task.status !== 'done' && (
        <div className="mt-3 pt-3 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
            className="w-full text-sm border border-gray-200 rounded-2xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
      )}
    </article>
  );
}
