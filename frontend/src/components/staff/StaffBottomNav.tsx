'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiBarChart2, FiCalendar, FiCheckSquare, FiHome } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { STAFF_MOBILE_NAV } from '@/lib/staffNav';

const NAV_ICONS: Record<string, IconType> = {
  '/staff': FiHome,
  '/staff/calendar': FiCalendar,
  '/staff/tasks': FiCheckSquare,
  '/staff/reports': FiBarChart2,
};

export default function StaffBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden bg-white border-t border-gray-200 grid grid-cols-4 items-stretch sticky bottom-0 z-40"
      aria-label="Staff navigation"
    >
      {STAFF_MOBILE_NAV.map((item) => {
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
            className="flex flex-col items-center justify-center py-1.5 min-h-[52px] active:bg-gray-50"
          >
            <span
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-colors ${
                active ? 'bg-gray-900 text-white' : 'text-gray-400'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.25 : 2} />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
