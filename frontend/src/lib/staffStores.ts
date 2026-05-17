'use client';

import { getStaffMemberById } from './staffAuth';
import { STORAGE_KEYS, type StaffStore } from './staffMockData';

export type StoreAssignments = Record<string, string[]>;

function ensureStorage() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(STORAGE_KEYS.stores)) {
    localStorage.setItem(STORAGE_KEYS.stores, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.storeAssignments)) {
    localStorage.setItem(STORAGE_KEYS.storeAssignments, JSON.stringify({}));
  }
}

export function getStores(): StaffStore[] {
  if (typeof window === 'undefined') return [];
  ensureStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stores);
    return raw ? (JSON.parse(raw) as StaffStore[]) : [];
  } catch {
    return [];
  }
}

function saveStores(stores: StaffStore[]) {
  localStorage.setItem(STORAGE_KEYS.stores, JSON.stringify(stores));
}

export function getStoreAssignments(): StoreAssignments {
  if (typeof window === 'undefined') return {};
  ensureStorage();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.storeAssignments);
    return raw ? (JSON.parse(raw) as StoreAssignments) : {};
  } catch {
    return {};
  }
}

function saveStoreAssignments(assignments: StoreAssignments) {
  localStorage.setItem(STORAGE_KEYS.storeAssignments, JSON.stringify(assignments));
}

export function getStaffStoreIds(staffId: string): string[] {
  return getStoreAssignments()[staffId] ?? [];
}

export function getStoreById(storeId: string): StaffStore | undefined {
  return getStores().find((s) => s.id === storeId);
}

export function getActiveStores(): StaffStore[] {
  return getStores().filter((s) => s.active);
}

/** Stores this user can pick when logging "Create order" */
export function getStoresForStaff(staffId: string): StaffStore[] {
  const user = getStaffMemberById(staffId);
  const active = getActiveStores();
  if (user?.role === 'staff_admin') return active;
  const ids = new Set(getStaffStoreIds(staffId));
  return active.filter((s) => ids.has(s.id));
}

function slugCode(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);
}

export function createStore(input: {
  name: string;
  city?: string;
  code?: string;
}): { ok: true; store: StaffStore } | { ok: false; error: string } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Store name is required' };

  const stores = getStores();
  const code = (input.code?.trim() || slugCode(name)) || `store-${Date.now()}`;
  if (stores.some((s) => s.code?.toLowerCase() === code.toLowerCase())) {
    return { ok: false, error: 'A store with this code already exists' };
  }

  const store: StaffStore = {
    id: `store-${Date.now()}`,
    name,
    code,
    city: input.city?.trim() || undefined,
    active: true,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  saveStores([store, ...stores]);
  return { ok: true, store };
}

export function updateStore(
  id: string,
  patch: Partial<Pick<StaffStore, 'name' | 'city' | 'code' | 'active'>>
): { ok: true } | { ok: false; error: string } {
  const stores = getStores();
  const idx = stores.findIndex((s) => s.id === id);
  if (idx === -1) return { ok: false, error: 'Store not found' };

  const name = patch.name !== undefined ? patch.name.trim() : stores[idx].name;
  if (!name) return { ok: false, error: 'Store name is required' };

  const code =
    patch.code !== undefined
      ? patch.code.trim() || slugCode(name)
      : stores[idx].code;
  if (
    code &&
    stores.some((s) => s.id !== id && s.code?.toLowerCase() === code.toLowerCase())
  ) {
    return { ok: false, error: 'Code already in use' };
  }

  const next = [...stores];
  next[idx] = {
    ...next[idx],
    name,
    code: code || next[idx].code,
    city: patch.city !== undefined ? patch.city.trim() || undefined : next[idx].city,
    active: patch.active !== undefined ? patch.active : next[idx].active,
  };
  saveStores(next);
  return { ok: true };
}

export function deleteStore(id: string): { ok: true } | { ok: false; error: string } {
  const stores = getStores();
  if (!stores.some((s) => s.id === id)) return { ok: false, error: 'Store not found' };
  saveStores(stores.filter((s) => s.id !== id));

  const assignments = getStoreAssignments();
  const next: StoreAssignments = {};
  Object.entries(assignments).forEach(([staffId, ids]) => {
    next[staffId] = ids.filter((sid) => sid !== id);
  });
  saveStoreAssignments(next);
  return { ok: true };
}

export function setStaffStoreIds(
  staffId: string,
  storeIds: string[]
): { ok: true } | { ok: false; error: string } {
  const member = getStaffMemberById(staffId);
  if (!member || member.role !== 'staff') {
    return { ok: false, error: 'Select an active staff member' };
  }

  const activeIds = new Set(getActiveStores().map((s) => s.id));
  const unique = [...new Set(storeIds.filter((id) => activeIds.has(id)))];

  const assignments = getStoreAssignments();
  assignments[staffId] = unique;
  saveStoreAssignments(assignments);
  return { ok: true };
}
