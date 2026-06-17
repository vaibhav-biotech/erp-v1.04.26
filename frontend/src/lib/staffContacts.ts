'use client';

import * as XLSX from 'xlsx';
import { getActiveStaffMembers, getStaffMemberById, getStaffUsers } from './staffAuth';
import type { AnalyticsPeriod } from './staffContactList';
import { getPeriodStart } from './staffContactList';
import {
  INITIAL_CALL_LOGS,
  INITIAL_CONTACTS,
  STORAGE_KEYS,
  type CallOutcome,
  type ContactStatus,
  type StaffCallLog,
  type StaffContact,
} from './staffMockData';

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.trim();
}

/** Company-wide: one phone number → one contact / one staff assignee */
export function findContactByPhone(
  phone: string,
  excludeContactId?: string
): StaffContact | undefined {
  const normalized = normalizePhone(phone);
  return getContacts().find(
    (c) => normalizePhone(c.phone) === normalized && c.id !== excludeContactId
  );
}

export function duplicatePhoneMessage(existing: StaffContact): string {
  const owner = getStaffName(existing.assignedToId);
  return `This number is already on ${owner}'s list. Each phone can only be assigned to one staff member.`;
}

export interface StaffContactSummary {
  staffId: string;
  staffName: string;
  username: string;
  total: number;
  bulkUploaded: number;
  manual: number;
  byStatus: Record<ContactStatus, number>;
  calledInPeriod: number;
  neverCalled: number;
}

export function getStaffContactSummaries(period: AnalyticsPeriod): StaffContactSummary[] {
  const contacts = getContacts();
  const periodStart = getPeriodStart(period).toISOString();
  const statsMap = getContactStatsMap();
  const contactIdsCalled = new Set<string>();

  for (const log of getCallLogs()) {
    if (log.calledAt >= periodStart) contactIdsCalled.add(log.contactId);
  }

  return getActiveStaffMembers().map((m) => {
    const mine = contacts.filter((c) => c.assignedToId === m.id);
    const byStatus: Record<ContactStatus, number> = {
      new: 0,
      contacted: 0,
      callback: 0,
      interested: 0,
      not_interested: 0,
    };
    let bulkUploaded = 0;
    let manual = 0;
    let calledInPeriod = 0;
    let neverCalled = 0;

    for (const c of mine) {
      byStatus[c.status]++;
      if (c.source === 'bulk_upload') bulkUploaded++;
      else manual++;
      if (contactIdsCalled.has(c.id)) calledInPeriod++;
      if (!statsMap.get(c.id)?.lastCalledAt) neverCalled++;
    }

    return {
      staffId: m.id,
      staffName: m.name,
      username: m.username,
      total: mine.length,
      bulkUploaded,
      manual,
      byStatus,
      calledInPeriod,
      neverCalled,
    };
  });
}

export function getContacts(): StaffContact[] {
  if (typeof window === 'undefined') return INITIAL_CONTACTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.contacts);
    return raw ? (JSON.parse(raw) as StaffContact[]) : INITIAL_CONTACTS;
  } catch {
    return INITIAL_CONTACTS;
  }
}

export function saveContacts(contacts: StaffContact[]) {
  localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(contacts));
}

export function getCallLogs(): StaffCallLog[] {
  if (typeof window === 'undefined') return INITIAL_CALL_LOGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.callLogs);
    return raw ? (JSON.parse(raw) as StaffCallLog[]) : INITIAL_CALL_LOGS;
  } catch {
    return INITIAL_CALL_LOGS;
  }
}

export function saveCallLogs(logs: StaffCallLog[]) {
  localStorage.setItem(STORAGE_KEYS.callLogs, JSON.stringify(logs));
}

export function getCallLogsForContact(contactId: string) {
  return getCallLogs()
    .filter((l) => l.contactId === contactId)
    .sort((a, b) => b.calledAt.localeCompare(a.calledAt));
}

export function getContactStats(contactId: string) {
  const logs = getCallLogsForContact(contactId);
  return {
    totalCalls: logs.length,
    lastCalledAt: logs[0]?.calledAt ?? null,
  };
}

/** One pass over call logs — use for large contact lists */
export function getContactStatsMap(): Map<
  string,
  { totalCalls: number; lastCalledAt: string | null }
> {
  const map = new Map<string, { totalCalls: number; lastCalledAt: string | null }>();
  for (const log of getCallLogs()) {
    const cur = map.get(log.contactId) ?? { totalCalls: 0, lastCalledAt: null };
    cur.totalCalls += 1;
    if (!cur.lastCalledAt || log.calledAt > cur.lastCalledAt) {
      cur.lastCalledAt = log.calledAt;
    }
    map.set(log.contactId, cur);
  }
  return map;
}

export function createCallLog(input: {
  contactId: string;
  staffId: string;
  outcome: CallOutcome;
  orderStoreId?: string;
  notes?: string;
  durationMinutes?: number;
  calledAt?: string;
}): StaffCallLog {
  const log: StaffCallLog = {
    id: `cl-${Date.now()}`,
    contactId: input.contactId,
    staffId: input.staffId,
    calledAt: input.calledAt ?? new Date().toISOString(),
    outcome: input.outcome,
    orderStoreId:
      input.outcome === 'create_order' ? input.orderStoreId : undefined,
    notes: input.notes?.trim(),
    durationMinutes: input.durationMinutes,
  };
  saveCallLogs([log, ...getCallLogs()]);
  return log;
}

export function updateContactStatus(contactId: string, status: ContactStatus) {
  const next = getContacts().map((c) => (c.id === contactId ? { ...c, status } : c));
  saveContacts(next);
}

export function reassignContact(contactId: string, assignedToId: string) {
  const next = getContacts().map((c) =>
    c.id === contactId ? { ...c, assignedToId } : c
  );
  saveContacts(next);
}

export function reassignContactsBulk(contactIds: string[], assignedToId: string) {
  const ids = new Set(contactIds);
  const next = getContacts().map((c) =>
    ids.has(c.id) ? { ...c, assignedToId } : c
  );
  saveContacts(next);
}

export function updateContact(
  contactId: string,
  updates: Partial<Omit<StaffContact, 'id' | 'createdAt' | 'source'>>
) {
  const next = getContacts().map((c) =>
    c.id === contactId ? { ...c, ...updates } : c
  );
  saveContacts(next);
}

export function createContact(input: {
  name: string;
  phone: string;
  assignedToId: string;
  email?: string;
  city?: string;
  notes?: string;
}): { ok: true; contact: StaffContact } | { ok: false; error: string } {
  const name = input.name.trim();
  const phone = normalizePhone(input.phone);
  if (!name) return { ok: false, error: 'Name is required' };
  if (!phone || phone.replace(/\D/g, '').length < 10) {
    return { ok: false, error: 'Valid phone number is required' };
  }

  const duplicate = findContactByPhone(phone);
  if (duplicate) {
    return { ok: false, error: duplicatePhoneMessage(duplicate) };
  }

  const assignee = getStaffMemberById(input.assignedToId);
  if (!assignee || assignee.role !== 'staff' || !assignee.active) {
    return { ok: false, error: 'Assign to an active staff member' };
  }

  const contact: StaffContact = {
    id: `c-${Date.now()}`,
    name,
    phone,
    email: input.email?.trim() || undefined,
    city: input.city?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status: 'new',
    assignedToId: input.assignedToId,
    createdAt: new Date().toISOString().slice(0, 10),
    source: 'manual',
  };

  saveContacts([contact, ...getContacts()]);
  return { ok: true, contact };
}

export type BulkRow = {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  assignedUsername?: string;
};

export type BulkParseResult =
  | { ok: true; rows: BulkRow[]; errors: string[] }
  | { ok: false; error: string };

function mapRawRow(row: Record<string, string>): BulkRow | null {
  const lower: Record<string, string> = {};
  Object.entries(row).forEach(([k, v]) => {
    lower[k.toLowerCase().trim()] = String(v ?? '').trim();
  });
  let name = lower.name || lower['full name'] || lower.client;
  const phone = lower.phone || lower.mobile || lower['phone number'];
  if (!phone) return null;
  if (!name) name = 'Unknown';
  return {
    name,
    phone,
    email: lower.email || undefined,
    city: lower.city || undefined,
    notes: lower.notes || lower.note || undefined,
    assignedUsername: lower.assigned_username || lower.username || lower.assignee || undefined,
  };
}

export async function parseBulkFile(file: File): Promise<BulkParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  try {
    if (ext === 'csv') {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) return { ok: false, error: 'CSV is empty or has no data rows' };
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows: BulkRow[] = [];
      const errors: string[] = [];
      for (let i = 1; i < lines.length; i++) {
        const vals = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const obj: Record<string, string> = {};
        headers.forEach((h, j) => {
          obj[h] = vals[j] ?? '';
        });
        const row = mapRawRow(obj);
        if (row) rows.push(row);
        else errors.push(`Row ${i + 1}: missing phone`);
      }
      return { ok: true, rows, errors };
    }

    if (ext === 'xlsx' || ext === 'xls') {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
      const rows: BulkRow[] = [];
      const errors: string[] = [];
      json.forEach((row, i) => {
        const mapped = mapRawRow(row);
        if (mapped) rows.push(mapped);
        else errors.push(`Row ${i + 2}: missing phone`);
      });
      return { ok: true, rows, errors };
    }

    return { ok: false, error: 'Use .csv or .xlsx file' };
  } catch {
    return { ok: false, error: 'Could not read file' };
  }
}

export function importContactsBulk(
  rows: BulkRow[],
  defaultAssignedToId: string,
  options?: { staffOnlyAssignSelf?: boolean }
): { imported: number; skipped: number; errors: string[] } {
  const existing = getContacts();
  const phones = new Set(existing.map((c) => normalizePhone(c.phone)));
  const users = getStaffUsers();
  const toAdd: StaffContact[] = [];
  const errors: string[] = [];
  let skipped = 0;

  rows.forEach((row, i) => {
    const phone = normalizePhone(row.phone);
    if (phones.has(phone)) {
      skipped++;
      const dup =
        existing.find((c) => normalizePhone(c.phone) === phone) ||
        toAdd.find((c) => normalizePhone(c.phone) === phone);
      if (dup) {
        errors.push(`Row ${i + 1}: ${duplicatePhoneMessage(dup)}`);
      } else {
        errors.push(`Row ${i + 1}: duplicate phone in this file`);
      }
      return;
    }
    let assignedToId = defaultAssignedToId;
    if (!options?.staffOnlyAssignSelf && row.assignedUsername) {
      const u = users.find(
        (x) => x.username.toLowerCase() === row.assignedUsername!.toLowerCase()
      );
      if (u && u.role === 'staff' && u.active) assignedToId = u.id;
      else errors.push(`Row ${i + 1}: unknown username "${row.assignedUsername}"`);
    }
    phones.add(phone);
    toAdd.push({
      id: `c-${Date.now()}-${i}`,
      name: row.name.trim(),
      phone,
      email: row.email,
      city: row.city,
      notes: row.notes,
      status: 'new',
      assignedToId,
      createdAt: new Date().toISOString().slice(0, 10),
      source: 'bulk_upload',
    });
  });

  saveContacts([...toAdd, ...existing]);
  return { imported: toAdd.length, skipped, errors };
}

export function formatCallDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString('default', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function getStaffName(staffId: string) {
  return getStaffMemberById(staffId)?.name ?? '—';
}
