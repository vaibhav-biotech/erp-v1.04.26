'use client';

import {
  TASK_STATUS_LABELS,
  WORK_TYPE_LABELS,
  type StaffTask,
  type TaskStatus,
} from '@/lib/staffMockData';
import { getActiveStaffMembers, getStaffMemberById } from '@/lib/staffAuth';

interface StaffTasksTableProps {
  tasks: StaffTask[];
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onReassign?: (id: string, assigneeId: string) => void;
  showAssignee?: boolean;
  showCreatedBy?: boolean;
  allowReassign?: boolean;
}

const statusBadge: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
};

export default function StaffTasksTable({
  tasks,
  onStatusChange,
  onReassign,
  showAssignee,
  showCreatedBy,
  allowReassign,
}: StaffTasksTableProps) {
  const activeStaff = getActiveStaffMembers();

  if (tasks.length === 0) {
    return <p className="text-center text-gray-500 py-8 text-sm">No tasks found.</p>;
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm text-left min-w-[640px]">
        <thead>
          <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
            <th className="py-3 px-2 font-medium">Task</th>
            {showAssignee && <th className="py-3 px-2 font-medium">Assigned to</th>}
            <th className="py-3 px-2 font-medium">Date</th>
            <th className="py-3 px-2 font-medium">Type</th>
            <th className="py-3 px-2 font-medium">Status</th>
            {showCreatedBy && <th className="py-3 px-2 font-medium">Created by</th>}
            {onStatusChange && <th className="py-3 px-2 font-medium">Update</th>}
            {allowReassign && onReassign && <th className="py-3 px-2 font-medium">Reassign</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {tasks.map((task) => {
            const assignee = getStaffMemberById(task.assigneeId);
            const creator = getStaffMemberById(task.createdById);
            return (
              <tr key={task.id} className="hover:bg-gray-50/80">
                <td className="py-3 px-2 font-medium text-gray-900 max-w-[200px]">{task.title}</td>
                {showAssignee && (
                  <td className="py-3 px-2 text-gray-600">
                    {assignee?.name ?? '—'}
                    {assignee && !assignee.active ? (
                      <span className="text-[10px] text-red-500 block">Inactive</span>
                    ) : null}
                  </td>
                )}
                <td className="py-3 px-2 text-gray-600 whitespace-nowrap">
                  {task.scheduledDate === new Date().toISOString().slice(0, 10)
                    ? 'Today'
                    : task.scheduledDate}
                </td>
                <td className="py-3 px-2 text-gray-600">{WORK_TYPE_LABELS[task.workType]}</td>
                <td className="py-3 px-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[task.status]}`}
                  >
                    {TASK_STATUS_LABELS[task.status]}
                  </span>
                </td>
                {showCreatedBy && (
                  <td className="py-3 px-2 text-gray-500 text-xs">
                    {creator?.name ?? '—'}
                    {creator?.role === 'staff_admin' ? ' (Admin)' : ''}
                  </td>
                )}
                {onStatusChange && (
                  <td className="py-3 px-2">
                    <select
                      value={task.status}
                      onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
                      className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-gray-400"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                )}
                {allowReassign && onReassign && (
                  <td className="py-3 px-2">
                    <select
                      value={task.assigneeId}
                      onChange={(e) => onReassign(task.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-xl px-2 py-1.5 bg-white outline-none focus:ring-2 focus:ring-gray-400 max-w-[120px]"
                    >
                      {activeStaff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
