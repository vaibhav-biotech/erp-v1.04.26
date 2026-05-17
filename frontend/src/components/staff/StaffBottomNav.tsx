'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiBarChart2,
  FiCalendar,
  FiCheckSquare,
  FiClipboard,
  FiHome,
  FiMapPin,
  FiPhone,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { getStaffSession } from '@/lib/staffAuth';
import { getStaffBottomNavItems } from '@/lib/staffNav';

const NAV_ICONS: Record<string, IconType> = {
  '/staff': FiHome,
  '/staff/calendar': FiCalendar,
  '/staff/tasks': FiCheckSquare,
  '/staff/contacts': FiPhone,
  '/staff/reports': FiBarChart2,
  '/staff/team': FiUsers,
  '/staff/stores': FiMapPin,
  '/staff/attendance': FiClipboard,
  '/staff/profile': FiUser,
};

export default function StaffBottomNav() {
  const pathname = usePathname();
  const session = getStaffSession();
  const role = session?.user.role ?? 'staff';
  const items = getStaffBottomNavItems(role);

  return (
    <nav
      className="lg:hidden bg-white border-t border-gray-200 sticky bottom-0 z-40"
      aria-label="Staff navigation"
    >
      <div className="flex overflow-x-auto overscroll-x-contain scrollbar-hide [-webkit-overflow-scrolling:touch] px-1">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = NAV_ICONS[item.href] ?? FiHome;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center shrink-0 min-w-[4.25rem] px-2 py-2 min-h-[52px] active:bg-gray-50"
            >
              <span
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
                  active ? 'bg-gray-900 text-white' : 'text-gray-400'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.25 : 2} />
              </span>
              <span
                className={`text-[10px] mt-0.5 truncate max-w-[4rem] ${
                  active ? 'text-gray-900 font-medium' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
