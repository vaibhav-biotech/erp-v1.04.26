'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getStaffSession, syncStaffUsersFromServer, type StaffSession } from '@/lib/staffAuth';
import StaffSidebar from './StaffSidebar';
import StaffBottomNav from './StaffBottomNav';
import StaffTopBar from './StaffTopBar';

export default function StaffDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<StaffSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = getStaffSession();
    if (!s) {
      router.replace('/staff/login');
      return;
    }
    void syncStaffUsersFromServer();
    const id = window.setTimeout(() => {
      setSession(s);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [router, pathname]);

  if (!ready || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <StaffSidebar role={session.user.role} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64 w-full">
        <StaffTopBar session={session} />
        <main className="flex-1 w-full p-4 lg:p-6 space-y-5 pb-24 lg:pb-8">
          {children}
        </main>
        <StaffBottomNav />
      </div>
    </div>
  );
}
