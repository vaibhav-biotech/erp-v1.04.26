export type StaffRole = 'staff' | 'staff_admin';
export type TaskStatus = 'pending' | 'in_progress' | 'done';
export type WorkType = 'social_media' | 'whatsapp' | 'sales' | 'operations';
export type StaffJobRole =
  | 'social_media_manager'
  | 'whatsapp_manager'
  | 'sales'
  | 'operations'
  | 'packaging'
  | 'customer_support';
export type AttendanceStatus = 'present' | 'absent' | 'holiday' | 'leave' | 'half_day';

export interface StaffUser {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  role: StaffRole;
  jobRoles: StaffJobRole[];
  avatarInitials: string;
  /** Office / company mobile */
  phone?: string;
  /** false = left company, cannot log in */
  active: boolean;
}

export interface StaffTask {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  workType: WorkType;
  scheduledDate: string;
  scheduledTime?: string;
  status: TaskStatus;
  createdById: string;
}

export interface StaffAttendance {
  staffId: string;
  date: string;
  status: AttendanceStatus;
}

export const STAFF_JOB_ROLE_OPTIONS: { id: StaffJobRole; label: string }[] = [
  { id: 'social_media_manager', label: 'Social Media Manager' },
  { id: 'whatsapp_manager', label: 'WhatsApp Manager' },
  { id: 'sales', label: 'Sales' },
  { id: 'operations', label: 'Operations' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'customer_support', label: 'Customer Support' },
];

export const JOB_ROLE_LABELS: Record<StaffJobRole, string> = Object.fromEntries(
  STAFF_JOB_ROLE_OPTIONS.map((o) => [o.id, o.label])
) as Record<StaffJobRole, string>;

export const WORK_TYPE_LABELS: Record<WorkType, string> = {
  social_media: 'Social Media',
  whatsapp: 'WhatsApp',
  sales: 'Sales',
  operations: 'Operations',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  done: 'Done',
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  holiday: 'Holiday',
  leave: 'Leave',
  half_day: 'Half Day',
};

export const ADMIN_ATTENDANCE_OPTIONS: AttendanceStatus[] = ['present', 'absent', 'holiday'];

export const DEMO_STAFF_USERS: StaffUser[] = [
  {
    id: 'staff-1',
    username: 'priya',
    email: 'staff@plantsingarden.com',
    password: 'staff123',
    name: 'Priya Sharma',
    role: 'staff',
    jobRoles: ['social_media_manager', 'whatsapp_manager'],
    avatarInitials: 'PS',
    phone: '+91 98765 43210',
    active: true,
  },
  {
    id: 'admin-1',
    username: 'admin',
    email: 'admin@plantsingarden.com',
    password: 'admin123',
    name: 'Rahul Manager',
    role: 'staff_admin',
    jobRoles: ['operations'],
    avatarInitials: 'RM',
    phone: '+91 90000 00000',
    active: true,
  },
];

const today = new Date();
const fmt = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

export const INITIAL_TASKS: StaffTask[] = [
  {
    id: 't1',
    title: 'Post Instagram reel — Monstera care',
    description: 'Use brand hashtags #PlantsInGarden',
    assigneeId: 'staff-1',
    workType: 'social_media',
    scheduledDate: fmt(0),
    scheduledTime: '10:00',
    status: 'in_progress',
    createdById: 'admin-1',
  },
  {
    id: 't2',
    title: 'Reply WhatsApp leads from weekend',
    assigneeId: 'staff-1',
    workType: 'whatsapp',
    scheduledDate: fmt(0),
    scheduledTime: '14:00',
    status: 'pending',
    createdById: 'admin-1',
  },
  {
    id: 't3',
    title: 'Update product catalog on WhatsApp Business',
    assigneeId: 'staff-1',
    workType: 'whatsapp',
    scheduledDate: fmt(1),
    scheduledTime: '11:00',
    status: 'pending',
    createdById: 'staff-1',
  },
  {
    id: 't4',
    title: 'Story: New indoor plants arrival',
    assigneeId: 'staff-1',
    workType: 'social_media',
    scheduledDate: fmt(-1),
    scheduledTime: '16:00',
    status: 'done',
    createdById: 'admin-1',
  },
  {
    id: 't5',
    title: 'Weekly social analytics report',
    assigneeId: 'staff-1',
    workType: 'social_media',
    scheduledDate: fmt(2),
    status: 'pending',
    createdById: 'admin-1',
  },
];

export const INITIAL_ATTENDANCE: StaffAttendance[] = [
  { staffId: 'staff-1', date: fmt(-2), status: 'present' },
  { staffId: 'staff-1', date: fmt(-1), status: 'present' },
  { staffId: 'staff-1', date: fmt(0), status: 'present' },
  { staffId: 'staff-1', date: fmt(1), status: 'holiday' },
];

export const STORAGE_KEYS = {
  session: 'staff_folder_session_v1',
  users: 'staff_folder_users_v1',
  tasks: 'staff_folder_tasks_v1',
  attendance: 'staff_folder_attendance_v1',
} as const;

export function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
