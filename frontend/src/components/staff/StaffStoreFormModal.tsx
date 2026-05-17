'use client';

import { useState } from 'react';
import { createStore, updateStore } from '@/lib/staffStores';
import type { StaffStore } from '@/lib/staffMockData';

interface StaffStoreFormModalProps {
  store?: StaffStore;
  onClose: () => void;
  onSaved?: () => void;
}

export default function StaffStoreFormModal({
  store,
  onClose,
  onSaved,
}: StaffStoreFormModalProps) {
  const isEdit = Boolean(store);
  const [name, setName] = useState(store?.name ?? '');
  const [city, setCity] = useState(store?.city ?? '');
  const [code, setCode] = useState(store?.code ?? '');
  const [active, setActive] = useState(store?.active ?? true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result = isEdit
      ? updateStore(store!.id, { name, city, code, active })
      : createStore({ name, city, code: code || undefined });
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
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900">
          {isEdit ? 'Edit store' : 'Add store'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Stores appear when staff log calls with &quot;Create order&quot;.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Store name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Plants in Garden — Delhi"
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Delhi"
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Code (optional)</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="delhi"
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          {isEdit && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Active</p>
                <p className="text-xs text-gray-500">Inactive stores are hidden from staff</p>
              </div>
              <button
                type="button"
                onClick={() => setActive((v) => !v)}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  active ? 'bg-gray-900' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    active ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          )}
          {error && (
            <p className="text-xs text-red-700 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-2xl text-sm font-medium"
            >
              {isEdit ? 'Save' : 'Add store'}
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
