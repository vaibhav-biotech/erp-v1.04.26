'use client';

import { useEffect, useState } from 'react';
import { getActiveStores, getStaffStoreIds, setStaffStoreIds } from '@/lib/staffStores';
import type { StaffUser } from '@/lib/staffMockData';

interface StaffAssignStoresModalProps {
  member: StaffUser;
  onClose: () => void;
  onSaved?: () => void;
}

export default function StaffAssignStoresModal({
  member,
  onClose,
  onSaved,
}: StaffAssignStoresModalProps) {
  const stores = getActiveStores();
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelected(getStaffStoreIds(member.id));
  }, [member.id]);

  const toggle = (storeId: string) => {
    setSelected((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const selectAll = () => setSelected(stores.map((s) => s.id));
  const clearAll = () => setSelected([]);

  const save = () => {
    setError('');
    const result = setStaffStoreIds(member.id, selected);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-900">Assign stores</h3>
          <p className="text-sm text-gray-500 mt-1">{member.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Check stores this staff can use for &quot;Create order&quot; on calls. Uncheck to
            unassign.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={selectAll}
              disabled={!stores.length}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50"
            >
              Clear all
            </button>
            <span className="text-xs text-gray-500 ml-auto self-center">
              {selected.length} selected
            </span>
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {stores.length === 0 ? (
            <li className="text-sm text-gray-500 text-center py-6">
              No active stores. Add stores on the Stores page first.
            </li>
          ) : (
            stores.map((s) => {
              const checked = selected.includes(s.id);
              return (
                <li key={s.id}>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                      checked
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(s.id)}
                      className="rounded border-gray-300 text-gray-900"
                    />
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                    {s.city && <span className="text-xs text-gray-500 ml-auto">{s.city}</span>}
                  </label>
                </li>
              );
            })
          )}
        </ul>

        <div className="p-4 border-t border-gray-100 shrink-0 space-y-2">
          {error && (
            <p className="text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-2xl text-sm font-medium"
            >
              Save assignments
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-sm border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
