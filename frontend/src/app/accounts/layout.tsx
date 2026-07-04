'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GroupedSidebar from '@/components/GroupedSidebar';
import Topbar from '@/components/Topbar';

export default function AccountsAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { adminAuthenticated, adminLoading, admin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname?.endsWith('/login');

  useEffect(() => {
    if (isLoginPage) return;
    if (!adminLoading && (!adminAuthenticated || (admin?.role !== 'accountant' && admin?.role !== 'super_admin'))) {
      router.push('/accounts/login');
    }
  }, [adminLoading, adminAuthenticated, admin, router, isLoginPage]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts portal...</p>
        </div>
      </div>
    );
  }

  if (!adminAuthenticated || (admin?.role !== 'accountant' && admin?.role !== 'super_admin')) {
    return null;
  }

  return (
    <div className="flex h-screen print:h-auto bg-gray-50 print:bg-white">
      {/* Sidebar - fixed width */}
      <div className="w-64 fixed left-0 top-0 h-screen overflow-hidden print:hidden">
        <GroupedSidebar />
      </div>

      {/* Main Content Area with topbar space */}
      <div className="ml-64 print:ml-0 flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Topbar - with proper spacing for sidebar */}
        <div className="min-h-[4.5rem] bg-white border-b border-gray-200 flex items-center px-8 print:hidden">
          <Topbar />
        </div>

        {/* Content - scrollable without overlap */}
        <main className="flex-1 overflow-auto print:overflow-visible bg-gray-50 print:bg-white">
          <div className="px-4 sm:px-6 lg:px-8 py-8 print:p-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
