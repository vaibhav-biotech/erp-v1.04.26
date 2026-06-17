'use client';

import { useState } from 'react';
import { reassignContactsBulk } from '@/lib/staffContacts';
import { getActiveStaffMembers } from '@/lib/staffAuth';

interface StaffBulkAssignModalProps {
  contactIds: string[];
  onClose: () => void;
  onAssigned?: () => void;
}

export default function StaffBulkAssignModal({
  contactIds,
  onClose,
  onAssigned,
}: StaffBulkAssignModalProps) {
  const staffList = getActiveStaffMembers();
  const [assigneeId, setAssigneeId] = useState(staffList[0]?.id || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!assigneeId) {
      setError('Please select a staff member.');
      return;
    }
    
    reassignContactsBulk(contactIds, assigneeId);
    
    onAssigned?.();
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
        <h3 className="font-semibold text-gray-900">Bulk assign contacts</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Assign {contactIds.length} contact{contactIds.length !== 1 ? 's' : ''} to a team member.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assign to</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-400"
              required
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-2xl text-sm font-medium"
            >
              Confirm assignment
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-sm border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
