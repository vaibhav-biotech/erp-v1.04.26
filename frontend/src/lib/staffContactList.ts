import type { ContactStatus, StaffContact } from './staffMockData';

export type ContactSortKey =
  | 'last_call_desc'
  | 'last_call_asc'
  | 'name_asc'
  | 'name_desc'
  | 'status'
  | 'created_desc'
  | 'calls_desc'
  | 'never_called_first';

export type AnalyticsPeriod = 'weekly' | 'monthly' | 'annually';

export const CONTACT_STATUS_FILTER_OPTIONS: { value: ContactStatus | 'all'; label: string }[] =
  [
    { value: 'all', label: 'All statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'callback', label: 'Callback' },
    { value: 'interested', label: 'Interested' },
    { value: 'not_interested', label: 'Not interested' },
  ];

export const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  annually: 'Annually',
};

export interface ContactRow extends StaffContact {
  totalCalls: number;
  lastCalledAt: string | null;
}

export function getPeriodStart(period: AnalyticsPeriod): Date {
  const d = new Date();
  if (period === 'weekly') {
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'monthly') {
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  d.setFullYear(d.getFullYear() - 1);
  return d;
}

export function sortContacts(rows: ContactRow[], sort: ContactSortKey): ContactRow[] {
  const copy = [...rows];
  const statusOrder: Record<ContactStatus, number> = {
    callback: 0,
    new: 1,
    interested: 2,
    contacted: 3,
    not_interested: 4,
  };

  copy.sort((a, b) => {
    switch (sort) {
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'status':
        return statusOrder[a.status] - statusOrder[b.status] || a.name.localeCompare(b.name);
      case 'created_desc':
        return b.createdAt.localeCompare(a.createdAt);
      case 'calls_desc':
        return b.totalCalls - a.totalCalls || a.name.localeCompare(b.name);
      case 'never_called_first':
        if (!a.lastCalledAt && b.lastCalledAt) return -1;
        if (a.lastCalledAt && !b.lastCalledAt) return 1;
        if (!a.lastCalledAt && !b.lastCalledAt) return a.name.localeCompare(b.name);
        return (b.lastCalledAt ?? '').localeCompare(a.lastCalledAt ?? '');
      case 'last_call_asc':
        if (!a.lastCalledAt && !b.lastCalledAt) return a.name.localeCompare(b.name);
        if (!a.lastCalledAt) return 1;
        if (!b.lastCalledAt) return -1;
        return a.lastCalledAt.localeCompare(b.lastCalledAt);
      case 'last_call_desc':
      default:
        if (!a.lastCalledAt && !b.lastCalledAt) return a.name.localeCompare(b.name);
        if (!a.lastCalledAt) return 1;
        if (!b.lastCalledAt) return -1;
        return b.lastCalledAt.localeCompare(a.lastCalledAt);
    }
  });
  return copy;
}

export function toggleSort(
  current: ContactSortKey,
  column: 'name' | 'last_call' | 'calls' | 'status' | 'created'
): ContactSortKey {
  const map: Record<string, [ContactSortKey, ContactSortKey]> = {
    name: ['name_asc', 'name_desc'],
    last_call: ['last_call_desc', 'last_call_asc'],
    calls: ['calls_desc', 'calls_desc'],
    status: ['status', 'status'],
    created: ['created_desc', 'created_desc'],
  };
  const [asc, desc] = map[column];
  if (current === asc) return desc;
  if (current === desc && column !== 'calls' && column !== 'status' && column !== 'created')
    return asc;
  return asc;
}
