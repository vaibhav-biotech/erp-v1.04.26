'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminDashboard from '@/components/SuperAdminDashboard';
import AllCustomersPage from '@/components/pages/AllCustomersPage';
import AnalyticsPage from '@/components/pages/AnalyticsPage';
import ManageAdminsPage from '@/components/pages/ManageAdminsPage';
import ManageStoresPage from '@/components/pages/ManageStoresPage';
import ManageAllStaffPage from '@/components/pages/ManageAllStaffPage';
import ManageAllOrdersPage from '@/components/pages/ManageAllOrdersPage';

export default function SuperAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, adminAuthenticated } = useAuth();
  
  const [currentPage, setCurrentPage] = useState('home');

  // Redirect if not authenticated or not super admin
  useEffect(() => {
    if (!adminAuthenticated || admin?.role !== 'super_admin') {
      router.push('/admin');
    }
  }, [adminAuthenticated, admin, router]);

  // Get page from URL search params
  useEffect(() => {
    const page = searchParams.get('page') || 'home';
    setCurrentPage(page);
  }, [searchParams]);

  const renderPage = () => {
    switch (currentPage) {
      case 'all-customers':
        return <AllCustomersPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'manage-stores':
        return <ManageStoresPage />;
      case 'manage-admins':
        return <ManageAdminsPage />;
      case 'manage-staff':
        return <ManageAllStaffPage />;
      case 'all-orders':
        return <ManageAllOrdersPage />;
      default:
        return <SuperAdminDashboard />;
    }
  };

  return <>{renderPage()}</>;
}

