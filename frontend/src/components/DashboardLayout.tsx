'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import HomePage from './pages/HomePage';
import CategoriesPage from './pages/CategoriesPage';
import OrdersPage from './pages/OrdersPage';
import UsersPage from './pages/UsersPage';
import CustomersPage from './pages/CustomersPage';
import AddProductPage from './pages/AddProductPage';
import AdminDashboard from '@/app/admin/dashboard/page';

export default function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState('home');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!loading && !token) {
      router.push('/auth/login');
    }
  }, [loading, token, router]);

  useEffect(() => {
    // Get page from URL search params on mount
    const page = searchParams.get('page') || 'home';
    setCurrentPage(page);
    setMounted(true);
  }, [searchParams]);

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    router.push(`/dashboard?page=${page}`, { scroll: false });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black text-lg">Loading...</p>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  if (!mounted) {
    return null;
  }

  const renderPage = () => {
    // If children are provided (from nested routes like /admin/dashboard/add-product), render them
    if (children) {
      return children;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'categories':
        return <CategoriesPage />;
      case 'products':
        return <AdminDashboard />;
      case 'add-product':
        return <AddProductPage />;
      case 'orders':
        return <OrdersPage />;
      case 'users':
        return <UsersPage />;
      case 'customers':
        return <CustomersPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="flex">
      <Sidebar onPageChange={handlePageChange} currentPage={currentPage} />
      <Topbar />
      <div className="flex-1 ml-64 mt-16 p-8 bg-gray-50 min-h-screen">
        {renderPage()}
      </div>
    </div>
  );
}
