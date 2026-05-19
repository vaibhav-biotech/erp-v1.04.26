'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import { logoutStaff } from '@/lib/staffAuth';
import { STAFF_SIDEBAR_NAV } from '@/lib/staffNav';
import { staffNavActive, staffNavInactive } from '@/lib/staffTheme';
import type { StaffRole } from '@/lib/staffMockData';

export default function StaffSidebar({ role }: { role: StaffRole }) {
  const router = useRouter();
  const pathname = usePathname();
  const items = STAFF_SIDEBAR_NAV.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-gray-200 z-40">
      <div className="px-6 py-5 border-b border-gray-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Staff Folder</p>
        <h1 className="text-lg font-bold text-gray-900 mt-1">Plants in Garden</h1>
        <p className="text-xs text-gray-500 mt-1">Daily workflow & reporting</p>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/staff' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                active ? staffNavActive : staffNavInactive
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => {
            logoutStaff();
            router.replace('/staff/login');
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 text-sm font-medium"
        >
          <FiLogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
