'use client';

import {
  DEMO_STAFF_USERS,
  INITIAL_ATTENDANCE,
  INITIAL_CALL_LOGS,
  INITIAL_CONTACTS,
  INITIAL_TASKS,
  STORAGE_KEYS,
  initialsFromName,
  type StaffAttendance,
  type StaffJobRole,
  type StaffTask,
  type StaffUser,
} from './staffMockData';
import {
  apiCreateStaffMember,
  apiFetchStaffUsers,
  apiResetStaffPassword,
  apiStaffLogin,
  apiUpdateStaffMember,
  type SafeStaffUser,
} from './staffApi';

export interface StaffSession {
  user: Omit<StaffUser, 'password'>;
}

function withoutPassword(user: StaffUser): Omit<StaffUser, 'password'> {
  const { password: _pw, ...safe } = user;
  void _pw;
  return safe;
}

function normalizeUser(raw: StaffUser & { jobTypes?: StaffJobRole[] }): StaffUser {
  return {
    ...raw,
    password: raw.password ?? '',
    jobRoles: raw.jobRoles?.length ? raw.jobRoles : raw.jobTypes || ['operations'],
    username: raw.username || raw.email?.split('@')[0] || 'user',
    phone: raw.phone ?? '',
    active: raw.active !== false,
  };
}

function safeUserToStaffUser(user: SafeStaffUser): StaffUser {
  return { ...user, password: '' };
}

export function getStaffToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.staffToken);
}

function setStaffToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.staffToken, token);
}

function cacheStaffUsersFromServer(users: SafeStaffUser[]) {
  saveStaffUsers(users.map(safeUserToStaffUser));
}

function seedStaffStorageIfNeeded() {
  if (!localStorage.getItem(STORAGE_KEYS.tasks)) {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(INITIAL_TASKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.attendance)) {
    localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(INITIAL_ATTENDANCE));
  }
  if (!localStorage.getItem(STORAGE_KEYS.contacts)) {
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(INITIAL_CONTACTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.callLogs)) {
    localStorage.setItem(STORAGE_KEYS.callLogs, JSON.stringify(INITIAL_CALL_LOGS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.stores)) {
    localStorage.setItem(STORAGE_KEYS.stores, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.storeAssignments)) {
    localStorage.setItem(STORAGE_KEYS.storeAssignments, JSON.stringify({}));
  }
}

/** Pull staff accounts from the API into localStorage (shared across browsers). */
export async function syncStaffUsersFromServer(): Promise<boolean> {
  const token = getStaffToken();
  if (!token) return false;

  try {
    const result = await apiFetchStaffUsers(token);
    if (!result.ok) return false;
    cacheStaffUsersFromServer(result.users);
    return true;
  } catch {
    return false;
  }
}

export function getStaffUsers(): StaffUser[] {
  if (typeof window === 'undefined') return DEMO_STAFF_USERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.users);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(DEMO_STAFF_USERS));
      return DEMO_STAFF_USERS;
    }
    const parsed = JSON.parse(raw) as (StaffUser & { jobTypes?: StaffJobRole[] })[];
    return parsed.map(normalizeUser);
  } catch {
    return DEMO_STAFF_USERS;
  }
}

export function saveStaffUsers(users: StaffUser[]) {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
}

export function getStaffMemberById(id: string) {
  return getStaffUsers().find((u) => u.id === id);
}

export function getStaffMembersOnly(includeInactive = true) {
  return getStaffUsers().filter(
    (u) => u.role === 'staff' && (includeInactive || u.active)
  );
}

export function getActiveStaffMembers() {
  return getStaffMembersOnly(false);
}

function assertStaffAdmin(): { ok: true } | { ok: false; error: string } {
  const session = getStaffSession();
  if (session?.user.role !== 'staff_admin') {
    return { ok: false, error: 'Only admin can do this' };
  }
  return { ok: true };
}

export function updateStaffMember(
  id: string,
  patch: Partial<Pick<StaffUser, 'phone' | 'active'>>
): { ok: true } | { ok: false; error: string } {
  const users = getStaffUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, error: 'Staff not found' };
  if (users[idx].role !== 'staff') return { ok: false, error: 'Cannot edit admin account' };

  const next = [...users];
  next[idx] = {
    ...next[idx],
    ...(patch.phone !== undefined ? { phone: patch.phone.trim() } : {}),
    ...(patch.active !== undefined ? { active: patch.active } : {}),
  };
  saveStaffUsers(next);
  return { ok: true };
}

function adminUpdateStaffMemberLocal(
  id: string,
  patch: {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    active?: boolean;
    jobRoles?: StaffJobRole[];
  }
): { ok: true } | { ok: false; error: string } {
  const users = getStaffUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, error: 'Staff not found' };
  if (users[idx].role !== 'staff') return { ok: false, error: 'Cannot edit admin account' };

  const cur = users[idx];
  const name = patch.name !== undefined ? patch.name.trim() : cur.name;
  if (!name) return { ok: false, error: 'Name is required' };

  const username =
    patch.username !== undefined ? patch.username.trim().toLowerCase() : cur.username;
  if (!username) return { ok: false, error: 'Username is required' };
  if (users.some((u) => u.id !== id && u.username.toLowerCase() === username)) {
    return { ok: false, error: 'Username already taken' };
  }

  const email =
    patch.email !== undefined
      ? patch.email.trim() || `${username}@plantsingarden.com`
      : cur.email;
  const jobRoles = patch.jobRoles !== undefined ? patch.jobRoles : cur.jobRoles;
  if (!jobRoles.length) return { ok: false, error: 'Select at least one role' };

  const next = [...users];
  next[idx] = {
    ...cur,
    name,
    username,
    email,
    avatarInitials: initialsFromName(name),
    phone: patch.phone !== undefined ? patch.phone.trim() : cur.phone,
    active: patch.active !== undefined ? patch.active : cur.active,
    jobRoles,
  };
  saveStaffUsers(next);
  return { ok: true };
}

/** Admin only — edit staff profile fields */
export async function adminUpdateStaffMember(
  id: string,
  patch: {
    name?: string;
    username?: string;
    email?: string;
    phone?: string;
    active?: boolean;
    jobRoles?: StaffJobRole[];
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = assertStaffAdmin();
  if (!gate.ok) return gate;

  const token = getStaffToken();
  if (token) {
    try {
      const apiResult = await apiUpdateStaffMember(token, id, patch);
      if (!apiResult.ok) return apiResult;
      await syncStaffUsersFromServer();
      return { ok: true };
    } catch {
      /* fall through to local */
    }
  }

  return adminUpdateStaffMemberLocal(id, patch);
}

function adminResetStaffPasswordLocal(
  id: string,
  newPassword: string
): { ok: true } | { ok: false; error: string } {
  const users = getStaffUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) return { ok: false, error: 'Staff not found' };
  if (users[idx].role !== 'staff') return { ok: false, error: 'Cannot reset admin password here' };

  const next = [...users];
  next[idx] = { ...next[idx], password: newPassword };
  saveStaffUsers(next);
  return { ok: true };
}

/** Admin only — set a new login password for staff */
export async function adminResetStaffPassword(
  id: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const gate = assertStaffAdmin();
  if (!gate.ok) return gate;

  const trimmed = newPassword.trim();
  if (!trimmed || trimmed.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters' };
  }

  const token = getStaffToken();
  if (token) {
    try {
      const apiResult = await apiResetStaffPassword(token, id, trimmed);
      if (!apiResult.ok) return apiResult;
      return { ok: true };
    } catch {
      /* fall through to local */
    }
  }

  return adminResetStaffPasswordLocal(id, trimmed);
}

export function reassignTask(taskId: string, assigneeId: string): boolean {
  const assignee = getStaffMemberById(assigneeId);
  if (!assignee || assignee.role !== 'staff' || !assignee.active) return false;

  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === taskId);
  if (idx === -1) return false;

  const next = [...tasks];
  next[idx] = { ...next[idx], assigneeId };
  saveTasks(next);
  return true;
}

function createStaffMemberLocal(input: {
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  jobRoles: StaffJobRole[];
}): { ok: true; user: StaffUser } | { ok: false; error: string } {
  const users = getStaffUsers();
  const username = input.username.trim().toLowerCase();
  if (!username) return { ok: false, error: 'Username is required' };
  if (users.some((u) => u.username.toLowerCase() === username)) {
    return { ok: false, error: 'Username already exists' };
  }
  const password = input.password.trim();
  if (!password || password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters' };
  }
  if (!input.jobRoles.length) {
    return { ok: false, error: 'Select at least one role' };
  }

  const user: StaffUser = {
    id: `staff-${Date.now()}`,
    username,
    email: input.email?.trim() || `${username}@plantsingarden.com`,
    password,
    name: input.name.trim(),
    role: 'staff',
    jobRoles: input.jobRoles,
    avatarInitials: initialsFromName(input.name),
    phone: input.phone?.trim() ?? '',
    active: true,
  };

  saveStaffUsers([...users, user]);
  return { ok: true, user };
}

export async function createStaffMember(input: {
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  jobRoles: StaffJobRole[];
}): Promise<{ ok: true; user: StaffUser } | { ok: false; error: string }> {
  const token = getStaffToken();
  const password = input.password.trim();

  if (token) {
    try {
      const apiResult = await apiCreateStaffMember(token, {
        ...input,
        password,
      });
      if (!apiResult.ok) return apiResult;
      await syncStaffUsersFromServer();
      return { ok: true, user: safeUserToStaffUser(apiResult.user) };
    } catch {
      /* fall through to local */
    }
  }

  return createStaffMemberLocal({ ...input, password });
}

export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    const session = JSON.parse(raw) as StaffSession;

    if (getStaffToken()) {
      if (session.user.role === 'staff' && session.user.active === false) return null;
      return session;
    }

    const fresh = getStaffUsers().find((u) => u.id === session.user.id);
    if (!fresh) return null;
    if (fresh.role === 'staff' && !fresh.active) return null;
    return { user: withoutPassword(fresh) };
  } catch {
    return null;
  }
}

function loginStaffLocal(loginId: string, password: string): StaffSession | null {
  const id = loginId.toLowerCase().trim();
  const pw = password.trim();
  const match = getStaffUsers().find(
    (u) =>
      u.password === pw &&
      (u.username.toLowerCase() === id || u.email.toLowerCase() === id)
  );
  if (!match) return null;
  if (match.role === 'staff' && !match.active) return null;

  const session: StaffSession = { user: withoutPassword(match) };
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  seedStaffStorageIfNeeded();
  return session;
}

export type StaffLoginResult =
  | { ok: true; session: StaffSession }
  | { ok: false; error: string; inactive?: boolean };

export async function loginStaff(loginId: string, password: string): Promise<StaffLoginResult> {
  const trimmedId = loginId.trim();
  const trimmedPassword = password.trim();

  try {
    const apiResult = await apiStaffLogin(trimmedId, trimmedPassword);
    if (apiResult.ok) {
      setStaffToken(apiResult.token);
      const session: StaffSession = { user: apiResult.user };
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
      seedStaffStorageIfNeeded();
      await syncStaffUsersFromServer();
      return { ok: true, session };
    }
    return {
      ok: false,
      error: apiResult.error,
      inactive: apiResult.inactive,
    };
  } catch {
    /* API unreachable — use offline demo storage */
  }

  const session = loginStaffLocal(trimmedId, trimmedPassword);
  if (!session) {
    return {
      ok: false,
      error: 'Invalid username/email or password',
    };
  }
  return { ok: true, session };
}

export function logoutStaff() {
  localStorage.removeItem(STORAGE_KEYS.session);
  localStorage.removeItem(STORAGE_KEYS.staffToken);
}

export function getTasks(): StaffTask[] {
  if (typeof window === 'undefined') return INITIAL_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.tasks);
    const tasks = raw ? (JSON.parse(raw) as StaffTask[]) : INITIAL_TASKS;
    return tasks.map((t) => ({
      ...t,
      createdById: t.createdById || 'admin-1',
    }));
  } catch {
    return INITIAL_TASKS;
  }
}

export function saveTasks(tasks: StaffTask[]) {
  localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
}

export function createTask(input: {
  title: string;
  assigneeId: string;
  workType: StaffTask['workType'];
  scheduledDate: string;
  scheduledTime?: string;
  createdById: string;
  description?: string;
}): StaffTask {
  const task: StaffTask = {
    id: `t-${Date.now()}`,
    title: input.title.trim(),
    description: input.description,
    assigneeId: input.assigneeId,
    workType: input.workType,
    scheduledDate: input.scheduledDate,
    scheduledTime: input.scheduledTime,
    status: 'pending',
    createdById: input.createdById,
  };
  const next = [task, ...getTasks()];
  saveTasks(next);
  return task;
}

export function getAttendance(): StaffAttendance[] {
  if (typeof window === 'undefined') return INITIAL_ATTENDANCE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.attendance);
    return raw ? (JSON.parse(raw) as StaffAttendance[]) : INITIAL_ATTENDANCE;
  } catch {
    return INITIAL_ATTENDANCE;
  }
}

export function saveAttendance(records: StaffAttendance[]) {
  localStorage.setItem(STORAGE_KEYS.attendance, JSON.stringify(records));
}

export function upsertAttendance(staffId: string, date: string, status: StaffAttendance['status']) {
  const records = getAttendance();
  const without = records.filter((r) => !(r.staffId === staffId && r.date === date));
  const next = [...without, { staffId, date, status }];
  saveAttendance(next);
  return next;
}

export function isStaffAdmin(session: StaffSession | null) {
  return session?.user.role === 'staff_admin';
}
