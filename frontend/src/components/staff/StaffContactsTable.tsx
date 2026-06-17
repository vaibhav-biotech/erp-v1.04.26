'use client';

import {
  CONTACT_STATUS_LABELS,
  type ContactStatus,
  type StaffContact,
} from '@/lib/staffMockData';
import { formatCallDateTime, getStaffName } from '@/lib/staffContacts';
import type { ContactRow, ContactSortKey } from '@/lib/staffContactList';

const statusClass: Record<ContactStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-gray-100 text-gray-700',
  callback: 'bg-yellow-100 text-yellow-800',
  interested: 'bg-green-100 text-green-800',
  not_interested: 'bg-red-100 text-red-800',
};

interface StaffContactsTableProps {
  rows: ContactRow[];
  isAdmin: boolean;
  sort: ContactSortKey;
  onSort: (column: 'name' | 'last_call' | 'calls' | 'status' | 'created') => void;
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onView: (contact: StaffContact) => void;
  onLogCall: (contact: StaffContact) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string | 'all') => void;
  onEdit: (contact: StaffContact) => void;
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  className = '',
}: {
  label: string;
  column: 'name' | 'last_call' | 'calls' | 'status' | 'created';
  sort: ContactSortKey;
  onSort: (column: 'name' | 'last_call' | 'calls' | 'status' | 'created') => void;
  className?: string;
}) {
  const active =
    (column === 'name' && (sort === 'name_asc' || sort === 'name_desc')) ||
    (column === 'last_call' &&
      (sort === 'last_call_desc' ||
        sort === 'last_call_asc' ||
        sort === 'never_called_first')) ||
    (column === 'calls' && sort === 'calls_desc') ||
    (column === 'status' && sort === 'status') ||
    (column === 'created' && sort === 'created_desc');

  const arrow =
    sort === 'name_desc' || sort === 'last_call_asc'
      ? ' ↑'
      : active
        ? ' ↓'
        : '';

  return (
    <th className={`py-3 px-2 font-medium ${className}`}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`inline-flex items-center gap-0.5 hover:text-gray-900 ${
          active ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {label}
        {active && <span className="text-[10px]">{arrow}</span>}
      </button>
    </th>
  );
}

export default function StaffContactsTable({
  rows,
  isAdmin,
  sort,
  onSort,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onView,
  onLogCall,
  selectedIds,
  onToggleSelect,
  onEdit,
}: StaffContactsTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  if (totalCount === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-sm">
        No contacts match your filters.
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        Showing {from}–{to} of {totalCount.toLocaleString()}
      </p>

      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm text-left min-w-[760px]">
          <thead>
            <tr className="border-b border-gray-100 text-xs uppercase tracking-wide">
              <th className="py-3 px-3 w-10">
                <input
                  type="checkbox"
                  checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
                  onChange={() => onToggleSelect('all')}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
              </th>
              <SortHeader label="Name" column="name" sort={sort} onSort={onSort} />
              <th className="py-3 px-2 font-medium text-gray-500">Phone</th>
              <th className="py-3 px-2 font-medium text-gray-500">City</th>
              {isAdmin && (
                <>
                  <th className="py-3 px-2 font-medium text-gray-500">Assigned</th>
                  <th className="py-3 px-2 font-medium text-gray-500">Source</th>
                </>
              )}
              <SortHeader label="Last call" column="last_call" sort={sort} onSort={onSort} />
              <SortHeader
                label="Calls"
                column="calls"
                sort={sort}
                onSort={onSort}
                className="text-center"
              />
              <SortHeader label="Status" column="status" sort={sort} onSort={onSort} />
              <th className="py-3 px-2 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/80">
                <td className="py-3 px-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c.id)}
                    onChange={() => onToggleSelect(c.id)}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  />
                </td>
                <td className="py-3 px-2 font-medium text-gray-900">{c.name}</td>
                <td className="py-3 px-2 text-gray-600 whitespace-nowrap">
                  <a href={`tel:${c.phone}`} className="hover:underline">
                    {c.phone}
                  </a>
                </td>
                <td className="py-3 px-2 text-gray-600">{c.city ?? '—'}</td>
                {isAdmin && (
                  <>
                    <td className="py-3 px-2 text-gray-600 text-xs">
                      {getStaffName(c.assignedToId)}
                    </td>
                    <td className="py-3 px-2 text-gray-500 text-xs capitalize">
                      {c.source === 'bulk_upload' ? 'Bulk' : 'Manual'}
                    </td>
                  </>
                )}
                <td className="py-3 px-2 text-gray-700 whitespace-nowrap">
                  {c.lastCalledAt ? (
                    <span className="text-xs">{formatCallDateTime(c.lastCalledAt)}</span>
                  ) : (
                    <span className="text-xs text-gray-400">Never</span>
                  )}
                </td>
                <td className="py-3 px-2 text-center font-semibold text-gray-900">
                  {c.totalCalls}
                </td>
                <td className="py-3 px-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusClass[c.status]}`}
                  >
                    {CONTACT_STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onView(c)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onLogCall(c)}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                    >
                      Log call
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="text-sm px-3 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 px-2">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="text-sm px-3 py-2 rounded-xl border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
