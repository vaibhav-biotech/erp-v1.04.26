'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import StaffAssignStoresModal from '@/components/staff/StaffAssignStoresModal';
import StaffStoreFormModal from '@/components/staff/StaffStoreFormModal';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { getActiveStaffMembers, getStaffSession } from '@/lib/staffAuth';
import type { StaffStore, StaffUser } from '@/lib/staffMockData';
import {
  deleteStore,
  getActiveStores,
  getStaffStoreIds,
  getStores,
} from '@/lib/staffStores';

export default function StaffStoresPage() {
  const router = useRouter();
  const session = getStaffSession();
  const isAdmin = session?.user.role === 'staff_admin';

  const [stores, setStores] = useState<StaffStore[]>(() => getStores());
  const [formStore, setFormStore] = useState<StaffStore | 'new' | null>(null);
  const [assignMember, setAssignMember] = useState<StaffUser | null>(null);
  const [assignKey, setAssignKey] = useState(0);

  const staffMembers = getActiveStaffMembers();
  const reload = useCallback(() => setStores(getStores()), []);

  if (!isAdmin) {
    if (typeof window !== 'undefined') router.replace('/staff');
    return null;
  }

  const handleDelete = (store: StaffStore) => {
    if (!confirm(`Delete "${store.name}"? Staff assignments will be updated.`)) return;
    deleteStore(store.id);
    reload();
    setAssignKey((k) => k + 1);
  };

  return (
    <div className="space-y-5">
      <StaffPanel>
        <div className="flex items-center justify-between mb-4">
          <div>
            <StaffSectionTitle>Stores</StaffSectionTitle>
            <p className="text-xs text-gray-500 mt-0.5">
              Create stores for &quot;Create order&quot; on call logs.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormStore('new')}
            className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-2xl shrink-0"
          >
            + Add store
          </button>
        </div>

        {stores.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No stores yet. Add your first store, then assign to staff below.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[520px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase">
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">City</th>
                  <th className="py-3 px-2">Code</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stores.map((s) => (
                  <tr key={s.id} className={!s.active ? 'opacity-60' : ''}>
                    <td className="py-3 px-2 font-medium text-gray-900">{s.name}</td>
                    <td className="py-3 px-2 text-gray-600">{s.city || '—'}</td>
                    <td className="py-3 px-2 text-gray-500 text-xs">{s.code || '—'}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          s.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setFormStore(s)}
                          className="text-xs font-medium text-gray-800 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="text-xs font-medium text-red-700 border border-red-100 px-3 py-1.5 rounded-xl hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </StaffPanel>

      <StaffPanel>
        <StaffSectionTitle>Assign stores to staff</StaffSectionTitle>
        <p className="text-xs text-gray-500 mt-1 mb-4">
          Assign or unassign multiple stores per staff — use checkboxes, Select all, or Clear all.
        </p>

        {staffMembers.length === 0 ? (
          <p className="text-sm text-gray-500">Create staff on the Team page first.</p>
        ) : getActiveStores().length === 0 ? (
          <p className="text-sm text-gray-500">Add at least one active store above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[400px]">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase">
                  <th className="py-3 px-2">Staff</th>
                  <th className="py-3 px-2">Stores assigned</th>
                  <th className="py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50" key={assignKey}>
                {staffMembers.map((m) => {
                  const ids = getStaffStoreIds(m.id);
                  const names = getActiveStores()
                    .filter((s) => ids.includes(s.id))
                    .map((s) => s.name);
                  return (
                    <tr key={m.id}>
                      <td className="py-3 px-2 font-medium text-gray-900">
                        {m.name}
                        <span className="block text-xs text-gray-500 font-normal">
                          @{m.username}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600 text-xs">
                        {ids.length === 0 ? (
                          <span className="text-amber-700">None assigned</span>
                        ) : (
                          <span title={names.join(', ')}>
                            {ids.length} store{ids.length !== 1 ? 's' : ''}
                            {names.length > 0 && (
                              <span className="block text-gray-400 truncate max-w-[200px]">
                                {names.slice(0, 2).join(', ')}
                                {names.length > 2 ? ` +${names.length - 2}` : ''}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <button
                          type="button"
                          onClick={() => setAssignMember(m)}
                          className="text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-xl"
                        >
                          Assign / unassign
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </StaffPanel>

      {formStore && (
        <StaffStoreFormModal
          store={formStore === 'new' ? undefined : formStore}
          onClose={() => setFormStore(null)}
          onSaved={reload}
        />
      )}

      {assignMember && (
        <StaffAssignStoresModal
          member={assignMember}
          onClose={() => setAssignMember(null)}
          onSaved={() => setAssignKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
