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

export type ContactStatus =
  | 'new'
  | 'contacted'
  | 'callback'
  | 'interested'
  | 'not_interested';

export type CallOutcome =
  | 'answered'
  | 'no_answer'
  | 'busy'
  | 'wrong_number'
  | 'callback'
  | 'converted'
  | 'create_order';

export interface StaffStore {
  id: string;
  name: string;
  code?: string;
  city?: string;
  active: boolean;
  createdAt: string;
}

export interface StaffContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  status: ContactStatus;
  assignedToId: string;
  createdAt: string;
  source: 'manual' | 'bulk_upload';
}

export interface StaffCallLog {
  id: string;
  contactId: string;
  staffId: string;
  calledAt: string;
  outcome: CallOutcome;
  /** Set when outcome is create_order — which store the order was placed on */
  orderStoreId?: string;
  durationMinutes?: number;
  notes?: string;
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

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  callback: 'Callback',
  interested: 'Interested',
  not_interested: 'Not interested',
};

export const CALL_OUTCOME_LABELS: Record<CallOutcome, string> = {
  answered: 'Answered',
  no_answer: 'No answer',
  busy: 'Busy',
  wrong_number: 'Wrong number',
  callback: 'Callback',
  converted: 'Converted',
  create_order: 'Create order',
};

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

export const INITIAL_CONTACTS: StaffContact[] = [
  {
    id: 'c1',
    name: 'Amit Verma',
    phone: '+919876543210',
    email: 'amit@example.com',
    city: 'Delhi',
    notes: 'Interested in indoor plants',
    status: 'callback',
    assignedToId: 'staff-1',
    createdAt: fmt(-5),
    source: 'manual',
  },
  {
    id: 'c2',
    name: 'Sneha Patel',
    phone: '+919988776655',
    city: 'Mumbai',
    status: 'new',
    assignedToId: 'staff-1',
    createdAt: fmt(-3),
    source: 'bulk_upload',
  },
  {
    id: 'c3',
    name: 'Rohit Singh',
    phone: '+919811223344',
    city: 'Bangalore',
    status: 'interested',
    assignedToId: 'staff-1',
    createdAt: fmt(-1),
    source: 'bulk_upload',
  },
];

export const INITIAL_CALL_LOGS: StaffCallLog[] = [
  {
    id: 'cl1',
    contactId: 'c1',
    staffId: 'staff-1',
    calledAt: `${fmt(-2)}T10:30:00`,
    outcome: 'answered',
    durationMinutes: 5,
    notes: 'Wants price list on WhatsApp',
  },
  {
    id: 'cl2',
    contactId: 'c1',
    staffId: 'staff-1',
    calledAt: `${fmt(0)}T14:00:00`,
    outcome: 'callback',
    notes: 'Call back tomorrow evening',
  },
  {
    id: 'cl3',
    contactId: 'c3',
    staffId: 'staff-1',
    calledAt: `${fmt(-1)}T11:00:00`,
    outcome: 'answered',
    durationMinutes: 8,
    notes: 'Asked about Monstera delivery',
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
  contacts: 'staff_folder_contacts_v1',
  callLogs: 'staff_folder_call_logs_v1',
  stores: 'staff_folder_stores_v1',
  storeAssignments: 'staff_folder_store_assignments_v1',
} as const;

export const MAX_STORES_PER_STAFF = 10;

export function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
