'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

import AccountsDashboardPage from '@/components/pages/AccountsDashboardPage';
import AccountsOrdersPage from '@/components/pages/AccountsOrdersPage';
import AccountsInvoicesPage from '@/components/pages/AccountsInvoicesPage';
import AccountsCreateInvoicePage from '@/components/pages/AccountsCreateInvoicePage';
import PurchaseOrdersPage from '@/components/pages/PurchaseOrdersPage';
import SuppliersPage from '@/components/pages/SuppliersPage';

export default function AccountsAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, adminAuthenticated } = useAuth();
  
  const [currentPage, setCurrentPage] = useState('accounts-overview');

  // Redirect if not authenticated or not allowed
  useEffect(() => {
    if (!adminAuthenticated || (admin?.role !== 'accountant' && admin?.role !== 'super_admin')) {
      router.push('/accounts/login');
    }
  }, [adminAuthenticated, admin, router]);

  // Get page from URL search params
  useEffect(() => {
    const page = searchParams.get('page') || 'accounts-overview';
    setCurrentPage(page);
  }, [searchParams]);

  const renderPage = () => {
    switch (currentPage) {
      case 'accounts-overview':
        return <AccountsDashboardPage />;
      case 'accounts-orders':
        return <AccountsOrdersPage />;
      case 'accounts-invoices':
        return <AccountsInvoicesPage />;
      case 'accounts-create-invoice':
        return <AccountsCreateInvoicePage />;
      case 'purchase-orders':
        return <PurchaseOrdersPage />;
      case 'suppliers':
        return <SuppliersPage />;
      default:
        return <AccountsDashboardPage />;
    }
  };

  return <>{renderPage()}</>;
}
