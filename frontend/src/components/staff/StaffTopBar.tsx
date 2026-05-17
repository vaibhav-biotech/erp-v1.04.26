'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { StaffSession } from '@/lib/staffAuth';
import { getPageTitle } from '@/lib/staffNav';
import { staffBtnPrimary } from '@/lib/staffTheme';

export default function StaffTopBar({ session }: { session: StaffSession }) {
  const pathname = usePathname();
  const { title, subtitle } = getPageTitle(pathname);

  return (
    <header className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-30">
      <div className="flex items-center justify-between w-full">
        <div className="min-w-0 flex-1 pr-3">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/staff/tasks"
            className={`lg:hidden px-3 py-2 rounded-xl text-sm ${staffBtnPrimary}`}
          >
            + Task
          </Link>
          <Link
            href="/staff/profile"
            className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
            title={`${session.user.name} — Profile`}
            aria-label="Go to profile"
          >
            {session.user.avatarInitials}
          </Link>
        </div>
      </div>
    </header>
  );
}
