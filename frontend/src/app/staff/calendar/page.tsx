'use client';

import { useEffect, useMemo, useState } from 'react';
import StaffTasksTable from '@/components/staff/StaffTasksTable';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { dateFromDay, getCalendarCells, todayInMonth } from '@/lib/staffCalendar';
import { formatYearMonth, monthLabel, shiftYearMonth } from '@/lib/staffAttendance';
import {
  getAttendance,
  getStaffMemberById,
  getStaffSession,
  getTasks,
  reassignTask,
  updateTaskStatus,
} from '@/lib/staffAuth';
import {
  attendanceDayClass,
  attendanceMark,
} from '@/lib/staffAttendance';
import {
  WORK_TYPE_LABELS,
  type AttendanceStatus,
  type StaffTask,
  type TaskStatus,
} from '@/lib/staffMockData';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const statusBadge: Record<TaskStatus, string> = {
  pending: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
};

function taskDayClass(dayTasks: StaffTask[]) {
  if (dayTasks.length === 0) return 'bg-gray-50 text-gray-500 border-gray-100';
  if (dayTasks.every((t) => t.status === 'done')) {
    return 'bg-green-500 text-white border-green-500';
  }
  if (dayTasks.some((t) => t.status === 'in_progress')) {
    return 'bg-yellow-400 text-yellow-950 border-yellow-400';
  }
  return 'bg-red-500 text-white border-red-500';
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${color}`} />
      <span className="text-gray-500 text-[10px] sm:text-xs">{label}</span>
    </div>
  );
}

function MobileTaskCards({
  tasks,
  isAdmin,
  onStatusChange,
}: {
  tasks: StaffTask[];
  isAdmin: boolean;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  if (tasks.length === 0) {
    return <p className="text-center text-gray-500 py-6 text-sm">No tasks this day.</p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const assignee = getStaffMemberById(task.assigneeId);
        return (
          <li
            key={task.id}
            className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 space-y-2"
          >
            <p className="font-medium text-gray-900 text-sm leading-snug">{task.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>{WORK_TYPE_LABELS[task.workType]}</span>
              {task.scheduledTime && <span>· {task.scheduledTime}</span>}
              {isAdmin && assignee && <span>· {assignee.name}</span>}
            </div>
            <select
              value={task.status}
              onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
              className={`w-full text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-gray-400 ${statusBadge[task.status]}`}
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </li>
        );
      })}
    </ul>
  );
}

export default function StaffCalendarPage() {
  const session = getStaffSession();
  const userId = session?.user.id ?? '';
  const isAdmin = session?.user.role === 'staff_admin';

  const [yearMonth, setYearMonth] = useState(() => formatYearMonth(new Date()));
  const [tasks, setTasks] = useState(() => getTasks());
  const [attendance, setAttendance] = useState(() => getAttendance());
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    todayInMonth(formatYearMonth(new Date()))
  );

  useEffect(() => {
    const refresh = () => {
      setTasks(getTasks());
      setAttendance(getAttendance());
    };
    refresh();
    const id = window.setInterval(refresh, 2000);
    return () => window.clearInterval(id);
  }, []);

  const assignedTasks = useMemo(() => {
    if (isAdmin) return tasks;
    return tasks.filter((t) => t.assigneeId === userId);
  }, [tasks, isAdmin, userId]);

  const tasksByDay = useMemo(() => {
    const map: Record<number, StaffTask[]> = {};
    assignedTasks
      .filter((t) => t.scheduledDate.startsWith(yearMonth))
      .forEach((t) => {
        const day = parseInt(t.scheduledDate.slice(8), 10);
        if (!Number.isNaN(day)) {
          if (!map[day]) map[day] = [];
          map[day].push(t);
        }
      });
    return map;
  }, [assignedTasks, yearMonth]);

  const attendanceByDay = useMemo(() => {
    const map: Record<number, AttendanceStatus> = {};
    const staffId = isAdmin ? null : userId;
    if (!staffId) return map;

    attendance
      .filter((r) => r.staffId === staffId && r.date.startsWith(yearMonth))
      .forEach((r) => {
        const day = parseInt(r.date.slice(8), 10);
        if (!Number.isNaN(day)) map[day] = r.status;
      });
    return map;
  }, [attendance, userId, yearMonth, isAdmin]);

  const cells = useMemo(() => getCalendarCells(yearMonth), [yearMonth]);

  useEffect(() => {
    const today = todayInMonth(yearMonth);
    setSelectedDay(today ?? 1);
  }, [yearMonth]);

  const selectedDate =
    selectedDay != null ? dateFromDay(yearMonth, selectedDay) : null;

  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return assignedTasks
      .filter((t) => t.scheduledDate === selectedDate)
      .sort((a, b) => (a.scheduledTime ?? '').localeCompare(b.scheduledTime ?? ''));
  }, [assignedTasks, selectedDate]);

  const monthTotal = useMemo(
    () => assignedTasks.filter((t) => t.scheduledDate.startsWith(yearMonth)).length,
    [assignedTasks, yearMonth]
  );

  const handleStatusChange = (id: string, status: TaskStatus) => {
    if (updateTaskStatus(id, status)) setTasks(getTasks());
  };

  const handleReassign = (id: string, assigneeId: string) => {
    if (reassignTask(id, assigneeId)) setTasks(getTasks());
  };

  const formatSelectedLabel = () => {
    if (!selectedDate) return 'Select a day';
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('default', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <StaffPanel className="p-3 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div className="min-w-0">
          <StaffSectionTitle>
            {isAdmin ? 'Team tasks' : 'My calendar'}
          </StaffSectionTitle>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {isAdmin
              ? `${monthTotal} tasks this month`
              : `${monthTotal} tasks · attendance from admin`}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setYearMonth((m) => shiftYearMonth(m, -1))}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg leading-none"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-xs sm:text-sm font-medium text-gray-800 min-w-[100px] sm:min-w-[120px] text-center truncate">
            {monthLabel(yearMonth)}
          </span>
          <button
            type="button"
            onClick={() => setYearMonth((m) => shiftYearMonth(m, 1))}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-lg leading-none"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-6">
        <div className="min-w-0">
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5 text-center mb-0.5">
            {WEEKDAYS.map((day, i) => (
              <div key={`wd-${i}`} className="text-gray-400 font-medium text-[10px] sm:text-xs py-0.5">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5">
            {cells.map((day, i) => {
              if (day == null) {
                return <div key={`empty-${i}`} className="h-9 sm:h-auto sm:aspect-square" />;
              }
              const dayTasks = tasksByDay[day] ?? [];
              const count = dayTasks.length;
              const attStatus = attendanceByDay[day];
              const isSelected = selectedDay === day;
              const isToday = todayInMonth(yearMonth) === day;
              const cellClass = isAdmin
                ? taskDayClass(dayTasks)
                : attStatus
                  ? attendanceDayClass(attStatus)
                  : 'bg-gray-50 text-gray-500 border-gray-100';

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`h-9 sm:aspect-square sm:h-auto rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all border font-semibold text-[10px] sm:text-xs ${cellClass} ${
                    isSelected
                      ? 'ring-2 ring-gray-900 ring-offset-1 sm:ring-offset-2 lg:scale-105 shadow-sm z-10'
                      : ''
                  } ${isToday && !isSelected ? 'ring-1 ring-gray-400' : ''}`}
                >
                  <span className="leading-none">{day}</span>
                  {!isAdmin && attStatus ? (
                    <span className="text-[8px] sm:text-[10px] leading-none mt-0.5 font-bold">
                      {attendanceMark(attStatus)}
                    </span>
                  ) : count > 0 ? (
                    <span
                      className={`text-[8px] sm:text-[10px] leading-none mt-0.5 font-bold px-1 rounded-full ${
                        isSelected || dayTasks.every((t) => t.status === 'done')
                          ? 'bg-white/30'
                          : 'bg-black/15'
                      }`}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-3 justify-center sm:justify-start">
            {isAdmin ? (
              <>
                <Legend color="bg-green-500" label="Done" />
                <Legend color="bg-yellow-400" label="Progress" />
                <Legend color="bg-red-500" label="Pending" />
              </>
            ) : (
              <>
                <Legend color="bg-green-500" label="Present" />
                <Legend color="bg-red-500" label="Absent" />
                <Legend color="bg-yellow-400" label="Holiday" />
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 lg:mt-0 lg:pt-0 lg:border-t-0 lg:border-l lg:pl-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide">
                {formatSelectedLabel()}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 mt-0.5">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="lg:hidden">
            <MobileTaskCards
              tasks={selectedTasks}
              isAdmin={isAdmin}
              onStatusChange={handleStatusChange}
            />
          </div>

          <div className="hidden lg:block overflow-x-auto -mx-1">
            <StaffTasksTable
              tasks={selectedTasks}
              onStatusChange={handleStatusChange}
              onReassign={isAdmin ? handleReassign : undefined}
              allowReassign={isAdmin}
              showAssignee={isAdmin}
            />
          </div>
        </div>
      </div>
    </StaffPanel>
  );
}
