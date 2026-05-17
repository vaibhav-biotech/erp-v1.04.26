'use client';

import { useState } from 'react';
import { createContact } from '@/lib/staffContacts';
import { getActiveStaffMembers } from '@/lib/staffAuth';

interface StaffAddContactModalProps {
  userId: string;
  isAdmin: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export default function StaffAddContactModal({
  userId,
  isAdmin,
  onClose,
  onCreated,
}: StaffAddContactModalProps) {
  const staffList = getActiveStaffMembers();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [assigneeId, setAssigneeId] = useState(userId);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = createContact({
      name,
      phone,
      email: email || undefined,
      city: city || undefined,
      notes: notes || undefined,
      assignedToId: isAdmin ? assigneeId : userId,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900">Add contact</h3>
        <p className="text-sm text-gray-500 mt-1">
          {isAdmin ? 'Assign to a staff member' : 'Added to your call list'}
        </p>
        <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5 mt-2">
          One phone number per company — cannot add if another staff already has this number.
        </p>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mt-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="Client name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Phone *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="+91 98765 43210"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>
          {isAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assign to</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-400"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400 resize-none"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-2xl text-sm font-medium"
            >
              Save contact
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
