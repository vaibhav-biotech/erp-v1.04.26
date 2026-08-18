'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GroupedSidebar from '@/components/GroupedSidebar';
import Topbar from '@/components/Topbar';
import { FiMenu, FiX } from 'react-icons/fi';

export default function StoreAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { adminAuthenticated, adminLoading, admin } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - fixed width */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:block h-screen overflow-hidden`}>
        <div className="md:hidden absolute top-4 right-4 z-50">
           <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-600">
             <FiX size={20} />
           </button>
        </div>
        <GroupedSidebar />
      </div>

      {/* Main Content Area with topbar space */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full">
        {/* Topbar - with proper spacing for sidebar */}
        <div className="min-h-[4.5rem] bg-white border-b border-gray-200 flex items-center px-4 sm:px-8 gap-4">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <FiMenu size={24} />
          </button>
          <div className="flex-1 w-full overflow-hidden">
            <Topbar />
          </div>
        </div>

        {/* Content - scrollable without overlap */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
