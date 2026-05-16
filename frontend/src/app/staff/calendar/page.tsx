'use client';

import { useEffect, useMemo, useState } from 'react';
import StaffTasksTable from '@/components/staff/StaffTasksTable';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { dateFromDay, getCalendarCells, todayInMonth } from '@/lib/staffCalendar';
import { formatYearMonth, monthLabel, shiftYearMonth } from '@/lib/staffAttendance';
import { getStaffSession, getTasks, reassignTask, saveTasks } from '@/lib/staffAuth';
import type { StaffTask, TaskStatus } from '@/lib/staffMockData';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-gray-500 text-xs">{label}</span>
    </div>
  );
}

export default function StaffCalendarPage() {
  const session = getStaffSession();
  const userId = session?.user.id ?? '';
  const isAdmin = session?.user.role === 'staff_admin';

  const [yearMonth, setYearMonth] = useState(() => formatYearMonth(new Date()));
  const [tasks, setTasks] = useState(() => getTasks());
  const [selectedDay, setSelectedDay] = useState<number | null>(() =>
    todayInMonth(formatYearMonth(new Date()))
  );

  useEffect(() => {
    const refresh = () => setTasks(getTasks());
    refresh();
    const id = window.setInterval(refresh, 2000);
    return () => window.clearInterval(id);
  }, []);

  /** Only tasks assigned to this user (staff) or all assigned tasks (admin) */
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
    const next = tasks.map((t) => (t.id === id ? { ...t, status } : t));
    setTasks(next);
    saveTasks(next);
  };

  const handleReassign = (id: string, assigneeId: string) => {
    if (reassignTask(id, assigneeId)) setTasks(getTasks());
  };

  const formatSelectedLabel = () => {
    if (!selectedDate) return 'Select a day';
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('default', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <StaffPanel>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
        <div>
          <StaffSectionTitle>
            {isAdmin ? 'Team assigned tasks' : 'My assigned tasks'}
          </StaffSectionTitle>
          <p className="text-sm text-gray-500 mt-1">
            {monthLabel(yearMonth)} · {monthTotal} assigned this month
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setYearMonth((m) => shiftYearMonth(m, -1))}
            className="w-10 h-10 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
            aria-label="Previous month"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-gray-800 min-w-[120px] text-center">
            {monthLabel(yearMonth)}
          </span>
          <button
            type="button"
            onClick={() => setYearMonth((m) => shiftYearMonth(m, 1))}
            className="w-10 h-10 rounded-2xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Assigned tasks per day
          </p>
          <div className="grid grid-cols-7 gap-1.5 text-center text-sm mb-1">
            {WEEKDAYS.map((day, i) => (
              <div key={`wd-${i}`} className="text-gray-400 font-medium text-xs py-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, i) => {
              if (day == null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const dayTasks = tasksByDay[day] ?? [];
              const count = dayTasks.length;
              const isSelected = selectedDay === day;
              const isToday = todayInMonth(yearMonth) === day;

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all border font-semibold ${taskDayClass(dayTasks)} ${
                    isSelected ? 'ring-2 ring-gray-900 ring-offset-2 scale-105 shadow-md' : ''
                  } ${isToday && !isSelected ? 'ring-2 ring-gray-400 ring-offset-1' : ''}`}
                >
                  <span>{day}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] mt-0.5 font-bold px-1.5 rounded-full min-w-[18px] ${
                        isSelected || dayTasks.every((t) => t.status === 'done')
                          ? 'bg-white/30'
                          : 'bg-black/15'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <Legend color="bg-green-500" label="All done" />
            <Legend color="bg-yellow-400" label="In progress" />
            <Legend color="bg-red-500" label="Pending" />
          </div>
        </div>

        <div className="lg:border-l lg:border-gray-100 lg:pl-6">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assigned tasks
              </p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{formatSelectedLabel()}</p>
            </div>
            <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
            </span>
          </div>
          <StaffTasksTable
            tasks={selectedTasks}
            onStatusChange={handleStatusChange}
            onReassign={isAdmin ? handleReassign : undefined}
            allowReassign={isAdmin}
            showAssignee={isAdmin}
          />
        </div>
      </div>
    </StaffPanel>
  );
}
