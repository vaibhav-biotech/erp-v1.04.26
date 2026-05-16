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
      <div className="flex items-center justify-between max-w-md mx-auto lg:max-w-4xl lg:mx-auto w-full">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/staff/tasks"
            className={`lg:hidden px-4 py-2 rounded-xl text-sm ${staffBtnPrimary}`}
          >
            + Task
          </Link>
          <div
            className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold shrink-0"
            title={session.user.name}
          >
            {session.user.avatarInitials}
          </div>
        </div>
      </div>
    </header>
  );
}
