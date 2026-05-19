import { buildApiUrl } from '@/lib/storeConfig';
import type {
  StaffAttendance,
  StaffJobRole,
  StaffTask,
  StaffUser,
  TaskStatus,
} from './staffMockData';

export type SafeStaffUser = Omit<StaffUser, 'password'>;

async function parseJson<T>(res: Response): Promise<{ ok: boolean; data?: T; error?: string }> {
  try {
    const body = await res.json();
    if (!res.ok || body.success === false) {
      return { ok: false, error: body.error || body.message || 'Request failed' };
    }
    return { ok: true, data: body.data as T };
  } catch {
    return { ok: false, error: 'Invalid server response' };
  }
}

export async function apiStaffLogin(
  loginId: string,
  password: string
): Promise<
  | { ok: true; token: string; user: SafeStaffUser }
  | { ok: false; error: string; inactive?: boolean }
> {
  const res = await fetch(buildApiUrl('/api/staff/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });

  if (res.status === 403) {
    return { ok: false, error: 'Account is inactive', inactive: true };
  }

  const parsed = await parseJson<{ token: string; user: SafeStaffUser }>(res);
  if (!parsed.ok || !parsed.data?.token || !parsed.data?.user) {
    return { ok: false, error: parsed.error || 'Invalid username/email or password' };
  }

  return { ok: true, token: parsed.data.token, user: parsed.data.user };
}

export async function apiFetchStaffUsers(
  token: string
): Promise<{ ok: true; users: SafeStaffUser[] } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl('/api/staff/users'), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const parsed = await parseJson<SafeStaffUser[]>(res);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error || 'Failed to load staff' };
  }

  return { ok: true, users: parsed.data };
}

export async function apiCreateStaffMember(
  token: string,
  input: {
    name: string;
    username: string;
    password: string;
    email?: string;
    phone?: string;
    jobRoles: StaffJobRole[];
  }
): Promise<{ ok: true; user: SafeStaffUser } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl('/api/staff/users'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const parsed = await parseJson<SafeStaffUser>(res);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error || 'Failed to create staff' };
  }

  return { ok: true, user: parsed.data };
}

export async function apiUpdateStaffMember(
  token: string,
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
  const res = await fetch(buildApiUrl(`/api/staff/users/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  const parsed = await parseJson<SafeStaffUser>(res);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error || 'Failed to update staff' };
  }

  return { ok: true };
}

export async function apiResetStaffPassword(
  token: string,
  id: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl(`/api/staff/users/${encodeURIComponent(id)}/password`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ newPassword }),
  });

  const parsed = await parseJson<unknown>(res);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error || 'Failed to reset password' };
  }

  return { ok: true };
}

export async function apiFetchStaffAttendance(
  token: string
): Promise<{ ok: true; records: StaffAttendance[] } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl('/api/staff/attendance'), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const parsed = await parseJson<StaffAttendance[]>(res);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error || 'Failed to load attendance' };
  }

  return { ok: true, records: parsed.data };
}

export async function apiUpsertStaffAttendance(
  token: string,
  input: { staffId: string; date: string; status: StaffAttendance['status'] }
): Promise<{ ok: true; record: StaffAttendance } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl('/api/staff/attendance'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

  const parsed = await parseJson<StaffAttendance>(res);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error || 'Failed to save attendance' };
  }

  return { ok: true, record: parsed.data };
}

export async function apiFetchStaffTasks(
  token: string
): Promise<{ ok: true; tasks: StaffTask[] } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl('/api/staff/tasks'), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const parsed = await parseJson<StaffTask[]>(res);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error || 'Failed to load tasks' };
  }

  return { ok: true, tasks: parsed.data };
}

export async function apiCreateStaffTask(
  token: string,
  task: StaffTask
): Promise<{ ok: true; task: StaffTask } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl('/api/staff/tasks'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(task),
  });

  const parsed = await parseJson<StaffTask>(res);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error || 'Failed to create task' };
  }

  return { ok: true, task: parsed.data };
}

export async function apiPatchStaffTask(
  token: string,
  id: string,
  patch: { status?: TaskStatus; assigneeId?: string }
): Promise<{ ok: true; task: StaffTask } | { ok: false; error: string }> {
  const res = await fetch(buildApiUrl(`/api/staff/tasks/${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(patch),
  });

  const parsed = await parseJson<StaffTask>(res);
  if (!parsed.ok || !parsed.data) {
    return { ok: false, error: parsed.error || 'Failed to update task' };
  }

  return { ok: true, task: parsed.data };
}
