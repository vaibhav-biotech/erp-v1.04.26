'use client';

import { useCallback, useMemo, useState } from 'react';
import StaffAddContactModal from '@/components/staff/StaffAddContactModal';
import StaffBulkUploadModal from '@/components/staff/StaffBulkUploadModal';
import StaffContactDetailModal from '@/components/staff/StaffContactDetailModal';
import StaffContactsAnalytics from '@/components/staff/StaffContactsAnalytics';
import StaffContactsTable from '@/components/staff/StaffContactsTable';
import StaffLogCallModal from '@/components/staff/StaffLogCallModal';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { getActiveStaffMembers, getStaffSession } from '@/lib/staffAuth';
import {
  CONTACT_STATUS_FILTER_OPTIONS,
  getPeriodStart,
  PAGE_SIZE_OPTIONS,
  sortContacts,
  toggleSort,
  type AnalyticsPeriod,
  type ContactRow,
  type ContactSortKey,
} from '@/lib/staffContactList';
import { getCallLogs, getContactStatsMap, getContacts } from '@/lib/staffContacts';
import type { ContactStatus, StaffContact } from '@/lib/staffMockData';

function scopeContacts(
  contacts: StaffContact[],
  isAdmin: boolean,
  userId: string,
  assigneeFilter: string
) {
  let list = isAdmin ? contacts : contacts.filter((c) => c.assignedToId === userId);
  if (isAdmin && assigneeFilter !== 'all') {
    list = list.filter((c) => c.assignedToId === assigneeFilter);
  }
  return list;
}

export default function StaffContactsPage() {
  const session = getStaffSession();
  const userId = session?.user.id ?? '';
  const isAdmin = session?.user.role === 'staff_admin';

  const [contacts, setContacts] = useState(() => getContacts());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [sort, setSort] = useState<ContactSortKey>('last_call_desc');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('weekly');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(50);
  const [page, setPage] = useState(1);
  const [viewContact, setViewContact] = useState<StaffContact | null>(null);
  const [logContact, setLogContact] = useState<StaffContact | null>(null);
  const [showBulk, setShowBulk] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const reload = useCallback(() => setContacts(getContacts()), []);

  const statsMap = useMemo(() => getContactStatsMap(), [contacts]);
  const callLogs = useMemo(() => getCallLogs(), [contacts]);
  const staffOptions = useMemo(() => getActiveStaffMembers(), []);

  const scoped = useMemo(
    () => scopeContacts(contacts, isAdmin, userId, assigneeFilter),
    [contacts, isAdmin, userId, assigneeFilter]
  );

  const analytics = useMemo(() => {
    const periodStart = getPeriodStart(analyticsPeriod).toISOString();
    const contactIds = new Set(scoped.map((c) => c.id));
    const calledInPeriod = new Set<string>();

    for (const log of callLogs) {
      if (contactIds.has(log.contactId) && log.calledAt >= periodStart) {
        calledInPeriod.add(log.contactId);
      }
    }

    let pendingCallback = 0;
    for (const c of scoped) {
      if (c.status === 'callback') pendingCallback++;
    }

    return {
      totalContacts: scoped.length,
      calledInPeriod: calledInPeriod.size,
      pendingCallback,
    };
  }, [scoped, analyticsPeriod, callLogs]);

  const filtered = useMemo(() => {
    let list = scoped;

    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.city?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    const rows: ContactRow[] = list.map((c) => {
      const stats = statsMap.get(c.id) ?? { totalCalls: 0, lastCalledAt: null };
      return { ...c, ...stats };
    });

    return sortContacts(rows, sort);
  }, [scoped, statusFilter, search, sort, statsMap]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const resetPage = () => setPage(1);

  const handleSort = (column: 'name' | 'last_call' | 'calls' | 'status' | 'created') => {
    setSort((s) => toggleSort(s, column));
    resetPage();
  };

  return (
    <div className="space-y-4">
      <StaffContactsAnalytics
        period={analyticsPeriod}
        onPeriodChange={setAnalyticsPeriod}
        totalContacts={analytics.totalContacts}
        calledInPeriod={analytics.calledInPeriod}
        pendingCallback={analytics.pendingCallback}
      />

      <StaffPanel className="p-3 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <StaffSectionTitle>{isAdmin ? 'All contacts' : 'My call list'}</StaffSectionTitle>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {isAdmin
                ? 'All staff contacts — sort columns · last call & status'
                : 'Your assigned contacts — each phone number is unique across the team'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="text-sm font-medium text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-2xl"
            >
              + Add contact
            </button>
            <button
              type="button"
              onClick={() => setShowBulk(true)}
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-2xl"
            >
              Bulk upload
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Search name, phone, city, email…"
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ContactStatus | 'all');
                resetPage();
              }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-400"
            >
              {CONTACT_STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                resetPage();
              }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-400"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>

            {isAdmin && (
              <select
                value={assigneeFilter}
                onChange={(e) => {
                  setAssigneeFilter(e.target.value);
                  resetPage();
                }}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-gray-400 col-span-2 sm:col-span-1"
              >
                <option value="all">All staff</option>
                {staffOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <StaffContactsTable
          rows={pageRows}
          isAdmin={isAdmin}
          sort={sort}
          onSort={handleSort}
          page={safePage}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={setPage}
          onView={setViewContact}
          onLogCall={setLogContact}
        />
      </StaffPanel>

      {viewContact && (
        <StaffContactDetailModal
          contact={viewContact}
          isAdmin={isAdmin}
          onClose={() => setViewContact(null)}
          onLogCall={() => {
            setLogContact(viewContact);
            setViewContact(null);
          }}
        />
      )}

      {logContact && (
        <StaffLogCallModal
          contact={logContact}
          staffId={userId}
          onClose={() => setLogContact(null)}
          onSaved={reload}
        />
      )}

      {showAdd && (
        <StaffAddContactModal
          userId={userId}
          isAdmin={isAdmin}
          onClose={() => setShowAdd(false)}
          onCreated={reload}
        />
      )}

      {showBulk && (
        <StaffBulkUploadModal
          defaultAssignedToId={userId}
          isAdmin={isAdmin}
          onClose={() => setShowBulk(false)}
          onImported={reload}
        />
      )}
    </div>
  );
}
