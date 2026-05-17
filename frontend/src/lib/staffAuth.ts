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
    jobRoles: raw.jobRoles?.length ? raw.jobRoles : raw.jobTypes || ['operations'],
    username: raw.username || raw.email?.split('@')[0] || 'user',
    phone: raw.phone ?? '',
    active: raw.active !== false,
  };
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

export function createStaffMember(input: {
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
  if (!input.password || input.password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters' };
  }
  if (!input.jobRoles.length) {
    return { ok: false, error: 'Select at least one role' };
  }

  const user: StaffUser = {
    id: `staff-${Date.now()}`,
    username,
    email: input.email?.trim() || `${username}@plantsingarden.com`,
    password: input.password,
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

export function getStaffSession(): StaffSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    if (!raw) return null;
    const session = JSON.parse(raw) as StaffSession;
    const fresh = getStaffUsers().find((u) => u.id === session.user.id);
    if (!fresh) return null;
    if (fresh.role === 'staff' && !fresh.active) return null;
    return { user: withoutPassword(fresh) };
  } catch {
    return null;
  }
}

export function loginStaff(loginId: string, password: string): StaffSession | null {
  const id = loginId.toLowerCase().trim();
  const match = getStaffUsers().find(
    (u) =>
      u.password === password &&
      (u.username.toLowerCase() === id || u.email.toLowerCase() === id)
  );
  if (!match) return null;
  if (match.role === 'staff' && !match.active) return null;

  const session: StaffSession = { user: withoutPassword(match) };
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));

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

  return session;
}

export function logoutStaff() {
  localStorage.removeItem(STORAGE_KEYS.session);
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
