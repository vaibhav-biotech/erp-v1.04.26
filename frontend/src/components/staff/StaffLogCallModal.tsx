'use client';

import { useMemo, useState } from 'react';
import { createCallLog, updateContactStatus } from '@/lib/staffContacts';
import {
  CALL_OUTCOME_LABELS,
  type CallOutcome,
  type StaffContact,
} from '@/lib/staffMockData';
import { getStoresForStaff } from '@/lib/staffStores';

interface StaffLogCallModalProps {
  contact: StaffContact;
  staffId: string;
  onClose: () => void;
  onSaved?: () => void;
}

export default function StaffLogCallModal({
  contact,
  staffId,
  onClose,
  onSaved,
}: StaffLogCallModalProps) {
  const now = new Date();
  const defaultDt = now.toISOString().slice(0, 16);
  const staffStores = useMemo(() => getStoresForStaff(staffId), [staffId]);

  const [calledAt, setCalledAt] = useState(defaultDt);
  const [outcome, setOutcome] = useState<CallOutcome>('answered');
  const [orderStoreId, setOrderStoreId] = useState(staffStores[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (outcome === 'create_order') {
      if (!staffStores.length) {
        setError('No stores assigned to your account. Contact admin.');
        return;
      }
      if (!orderStoreId) {
        setError('Select which store the order was placed on.');
        return;
      }
    }
    setError('');
    createCallLog({
      contactId: contact.id,
      staffId,
      outcome,
      orderStoreId: outcome === 'create_order' ? orderStoreId : undefined,
      notes,
      durationMinutes: duration ? parseInt(duration, 10) : undefined,
      calledAt: new Date(calledAt).toISOString(),
    });
    if (outcome === 'callback') updateContactStatus(contact.id, 'callback');
    else if (outcome === 'converted' || outcome === 'create_order')
      updateContactStatus(contact.id, 'interested');
    else if (outcome === 'answered') updateContactStatus(contact.id, 'contacted');
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900">Log call</h3>
        <p className="text-sm text-gray-500 mt-1">{contact.name}</p>
        <p className="text-xs text-gray-400">{contact.phone}</p>
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5 mt-2">
          Record only — call from your phone, then save here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date & time</label>
            <input
              type="datetime-local"
              value={calledAt}
              onChange={(e) => setCalledAt(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Outcome</label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as CallOutcome)}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-400"
            >
              {(Object.keys(CALL_OUTCOME_LABELS) as CallOutcome[]).map((k) => (
                <option key={k} value={k}>
                  {CALL_OUTCOME_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          {outcome === 'create_order' && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 space-y-2">
              <p className="text-xs font-medium text-emerald-900">Order placed on store</p>
              {staffStores.length === 0 ? (
                <p className="text-xs text-amber-800">
                  No stores linked to your account. Ask admin to assign stores.
                </p>
              ) : (
                <select
                  value={orderStoreId}
                  onChange={(e) => setOrderStoreId(e.target.value)}
                  required
                  className="w-full border border-emerald-200 rounded-2xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="">Select store…</option>
                  {staffStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.city ? ` (${s.city})` : ''}
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[11px] text-emerald-800/80">
                Pick the store where this customer&apos;s order was placed after the call.
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Duration (minutes, optional)
            </label>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
              placeholder="5"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400 resize-none"
              placeholder={
                outcome === 'create_order'
                  ? 'Order details, items, delivery…'
                  : 'What was discussed?'
              }
            />
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-2xl text-sm font-medium"
            >
              Save call record
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-sm text-gray-600 border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
