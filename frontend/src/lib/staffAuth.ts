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
  apiCreateStaffTask,
  apiFetchStaffAttendance,
  apiFetchStaffTasks,
  apiFetchStaffUsers,
  apiPatchStaffTask,
  apiResetStaffPassword,
  apiStaffLogin,
  apiUpdateStaffMember,
  apiUpsertStaffAttendance,
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

import { syncStaffContactsDataFromServer } from './staffContacts';

/** Pull tasks + attendance from API (shared across admin and staff browsers). */
export async function syncStaffPortalDataFromServer(): Promise<boolean> {
  const token = getStaffToken();
  if (!token) return false;

  try {
    const [attendanceResult, tasksResult] = await Promise.all([
      apiFetchStaffAttendance(token),
      apiFetchStaffTasks(token),
      syncStaffContactsDataFromServer(token),
    ]);

    let ok = true;
    if (attendanceResult.ok) {
      saveAttendance(attendanceResult.records);
    } else {
      ok = false;
    }
    if (tasksResult.ok) {
      saveTasks(tasksResult.tasks);
    } else {
      ok = false;
    }
    return ok;
  } catch {
    return false;
  }
}

/** Sync users, tasks, and attendance from the server. */
export async function syncStaffFolderFromServer(): Promise<void> {
  await Promise.all([syncStaffUsersFromServer(), syncStaffPortalDataFromServer()]);
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
  return { ok: false, error: 'Database connection required' };
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
  return { ok: false, error: 'Database connection required' };
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
  return patchTask(taskId, { assigneeId });
}

function pushTaskPatchToServer(
  id: string,
  patch: Partial<Pick<StaffTask, 'status' | 'assigneeId'>>
) {
  const token = getStaffToken();
  if (!token) return;
  void apiPatchStaffTask(token, id, patch).catch(() => {
    /* offline — local cache already updated */
  });
}

function pushAttendanceToServer(
  staffId: string,
  date: string,
  status: StaffAttendance['status']
) {
  const token = getStaffToken();
  if (!token) return;
  void apiUpsertStaffAttendance(token, { staffId, date, status }).catch(() => {
    /* offline */
  });
}

export function patchTask(
  id: string,
  patch: Partial<Pick<StaffTask, 'status' | 'assigneeId'>>
): boolean {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;

  const next = [...tasks];
  next[idx] = { ...next[idx], ...patch };
  saveTasks(next);
  pushTaskPatchToServer(id, patch);
  return true;
}

export function updateTaskStatus(id: string, status: StaffTask['status']): boolean {
  return patchTask(id, { status });
}

function createStaffMemberLocal(input: {
  name: string;
  username: string;
  password: string;
  email?: string;
  phone?: string;
  jobRoles: StaffJobRole[];
}): { ok: true; user: StaffUser } | { ok: false; error: string } {
  return { ok: false, error: 'Database connection required' };
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
  // Offline fallback is disabled for security.
  return null;
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
      await syncStaffFolderFromServer();
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

export async function createTask(input: {
  title: string;
  assigneeId: string;
  workType: StaffTask['workType'];
  scheduledDate: string;
  scheduledTime?: string;
  createdById: string;
  description?: string;
}): Promise<StaffTask> {
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
  saveTasks([task, ...getTasks()]);

  const token = getStaffToken();
  if (token) {
    try {
      const result = await apiCreateStaffTask(token, task);
      if (result.ok) {
        const tasks = getTasks().map((t) => (t.id === task.id ? result.task : t));
        saveTasks(tasks);
        return result.task;
      }
    } catch {
      /* keep local task */
    }
  }

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
  pushAttendanceToServer(staffId, date, status);
  return next;
}

export function isStaffAdmin(session: StaffSession | null) {
  return session?.user.role === 'staff_admin';
}
