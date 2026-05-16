'use client';

import { useState } from 'react';
import { upsertAttendance } from '@/lib/staffAuth';
import {
  ADMIN_ATTENDANCE_OPTIONS,
  ATTENDANCE_LABELS,
  type AttendanceStatus,
  type StaffUser,
} from '@/lib/staffMockData';

const BTN_CLASS: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-800 border-green-300',
  absent: 'bg-red-100 text-red-800 border-red-300',
  holiday: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  leave: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  half_day: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

interface StaffMarkAttendanceModalProps {
  member: StaffUser;
  onClose: () => void;
  onSaved?: () => void;
}

export default function StaffMarkAttendanceModal({
  member,
  onClose,
  onSaved,
}: StaffMarkAttendanceModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [saved, setSaved] = useState(false);

  const mark = (status: AttendanceStatus) => {
    upsertAttendance(member.id, date, status);
    setSaved(true);
    onSaved?.();
    setTimeout(onClose, 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900">Mark attendance</h3>
        <p className="text-sm text-gray-500 mt-1">{member.name}</p>

        <label className="block text-xs font-medium text-gray-600 mt-4 mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
        />

        <p className="text-xs text-gray-500 mt-4 mb-2">Status (updates staff calendar)</p>
        <div className="grid grid-cols-3 gap-2">
          {ADMIN_ATTENDANCE_OPTIONS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => mark(status)}
              className={`text-sm py-3 rounded-2xl border font-semibold transition-colors ${BTN_CLASS[status]}`}
            >
              {status === 'present' ? 'P' : status === 'absent' ? 'A' : 'H'}
              <span className="block text-[10px] font-normal mt-0.5 opacity-80">
                {ATTENDANCE_LABELS[status]}
              </span>
            </button>
          ))}
        </div>

        {saved && (
          <p className="text-sm text-gray-700 text-center mt-3">Saved — visible on staff calendar</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-2xl"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
