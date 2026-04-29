'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GroupedSidebar from '@/components/GroupedSidebar';
import Topbar from '@/components/Topbar';

export default function StoreAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { adminAuthenticated, adminLoading, admin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!adminLoading && (!adminAuthenticated || admin?.role !== 'store_admin')) {
      router.push('/admin');
    }
  }, [adminLoading, adminAuthenticated, admin, router]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!adminAuthenticated || admin?.role !== 'store_admin') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - fixed width */}
      <div className="w-64 fixed left-0 top-0 h-screen overflow-hidden">
        <GroupedSidebar />
      </div>

      {/* Main Content Area with topbar space */}
      <div className="ml-64 flex-1 flex flex-col overflow-hidden">
        {/* Topbar - with proper spacing for sidebar */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <Topbar />
        </div>

        {/* Content - scrollable without overlap */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
