'use client';

import { useState } from 'react';
import { updateStaffMember } from '@/lib/staffAuth';
import type { StaffUser } from '@/lib/staffMockData';

interface StaffManageMemberModalProps {
  member: StaffUser;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function StaffManageMemberModal({
  member,
  onClose,
  onUpdated,
}: StaffManageMemberModalProps) {
  const [phone, setPhone] = useState(member.phone ?? '');
  const [active, setActive] = useState(member.active);
  const [error, setError] = useState('');

  const save = () => {
    setError('');
    const result = updateStaffMember(member.id, { phone, active });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onUpdated?.();
    onClose();
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
        <h3 className="font-semibold text-gray-900">Manage staff</h3>
        <p className="text-sm text-gray-500 mt-1">{member.name}</p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{error}</p>
        )}

        <label className="block text-xs font-medium text-gray-600 mt-4 mb-1">
          Office mobile number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
        />

        <div className="mt-5 flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
          <div>
            <p className="text-sm font-medium text-gray-900">Account status</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {active ? 'Can log in and receive tasks' : 'Left — cannot log in'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActive((v) => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              active ? 'bg-gray-900' : 'bg-gray-300'
            }`}
            aria-label={active ? 'Deactivate staff' : 'Activate staff'}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                active ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={save}
            className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-2xl text-sm font-medium"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl text-sm text-gray-600 border border-gray-200 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
