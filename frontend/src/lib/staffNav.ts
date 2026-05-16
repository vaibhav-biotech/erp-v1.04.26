import type { StaffRole } from './staffMockData';

export interface StaffNavItem {
  href: string;
  label: string;
  exact?: boolean;
  roles?: StaffRole[];
  mobileOnly?: boolean;
  desktopOnly?: boolean;
}

/** Bottom nav — matches ssample.txt: Home, Calendar, Tasks, Reports */
export const STAFF_MOBILE_NAV: StaffNavItem[] = [
  { href: '/staff', label: 'Home', exact: true },
  { href: '/staff/calendar', label: 'Calendar' },
  { href: '/staff/tasks', label: 'Tasks' },
  { href: '/staff/reports', label: 'Reports' },
];

/** Desktop sidebar — mobile nav + admin extras */
export const STAFF_SIDEBAR_NAV: StaffNavItem[] = [
  ...STAFF_MOBILE_NAV,
  { href: '/staff/team', label: 'Team', roles: ['staff_admin'], desktopOnly: true },
  { href: '/staff/attendance', label: 'Attendance report', roles: ['staff_admin'], desktopOnly: true },
  { href: '/staff/profile', label: 'Profile', desktopOnly: true },
];

export function getPageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith('/staff/calendar')) {
    return { title: 'Calendar', subtitle: 'Team tasks by day' };
  }
  if (pathname.startsWith('/staff/tasks')) {
    return { title: 'Tasks', subtitle: 'Daily workflow & updates' };
  }
  if (pathname.startsWith('/staff/reports')) {
    return { title: 'Reports', subtitle: 'Daily performance summary' };
  }
  if (pathname.startsWith('/staff/team')) {
    return { title: 'Team', subtitle: 'Staff members & roles' };
  }
  if (pathname.startsWith('/staff/attendance')) {
    return { title: 'Attendance report', subtitle: 'Monthly team overview' };
  }
  if (pathname.startsWith('/staff/profile')) {
    return { title: 'Profile', subtitle: 'Your account' };
  }
  return { title: 'Staff Tasks', subtitle: 'Daily workflow & reporting' };
}
