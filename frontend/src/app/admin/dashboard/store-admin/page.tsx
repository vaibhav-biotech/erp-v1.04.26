'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { FiPlus, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import BulkUploadModal from '@/components/BulkUploadModal';
import ProductsTable from '@/components/ProductsTable';
import CategoriesPage from '@/components/pages/CategoriesPage';
import StoreAdminOrdersListPage from '@/components/pages/StoreAdminOrdersListPage';
import CustomersPage from '@/components/pages/CustomersPage';
import LandingPageManager from '@/components/pages/LandingPageManager';
import NotificationBarPage from '@/components/pages/NotificationBarPage';
import CategorySectionSettingsPage from '@/components/pages/CategorySectionSettingsPage';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
}

interface StoreInfo {
  _id: string;
  name: string;
  domain: string;
  primaryColor: string;
}

export default function StoreAdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, adminToken, adminAuthenticated, logoutAdmin } = useAuth();
  
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    draftProducts: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState('home');

  // Redirect if not authenticated or not store admin
  useEffect(() => {
    if (!adminAuthenticated || admin?.role !== 'store_admin') {
      router.push('/admin');
    }
  }, [adminAuthenticated, admin, router]);

  // Get page from URL search params
  useEffect(() => {
    const page = searchParams.get('page') || 'home';
    setCurrentPage(page);
  }, [searchParams]);

  // Fetch store info on load
  useEffect(() => {
    if (admin?.role === 'store_admin' && adminToken) {
      fetchStoreInfo();
      if (currentPage === 'home') {
        fetchStats();
      }
    }
  }, [admin, adminToken, currentPage]);

  const fetchStoreInfo = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/admin/profile'), {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (response.status === 401) {
        logoutAdmin();
        router.push('/admin');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setStoreInfo({
          _id: admin?._id || '',
          name: admin?.storeName || 'Your Store',
          domain: `${admin?.storeName}.plantsmall.com`,
          primaryColor: '#3B82F6'
        });
      }
    } catch (error) {
      console.error('Error fetching store info:', error);
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const headers = {
        ...getApiHeaders(adminToken || undefined),
        'Authorization': `Bearer ${adminToken}`
      };

      const [allRes, activeRes, inactiveRes, draftRes] = await Promise.all([
        fetch(buildApiUrl('/api/products?limit=1'), { headers }),
        fetch(buildApiUrl('/api/products?status=active&limit=1'), { headers }),
        fetch(buildApiUrl('/api/products?status=inactive&limit=1'), { headers }),
        fetch(buildApiUrl('/api/products?status=draft&limit=1'), { headers })
      ]);

      if ([allRes, activeRes, inactiveRes, draftRes].some((res) => res.status === 401)) {
        logoutAdmin();
        router.push('/admin');
        return;
      }

      const allData = await allRes.json();
      const activeData = await activeRes.json();
      const inactiveData = await inactiveRes.json();
      const draftData = await draftRes.json();

      setStats({
        totalProducts: allData.pagination?.total || 0,
        activeProducts: activeData.pagination?.total || 0,
        inactiveProducts: inactiveData.pagination?.total || 0,
        draftProducts: draftData.pagination?.total || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleUploadComplete = () => {
    setShowBulkUploadModal(false);
    setRefreshKey(prev => prev + 1);
    fetchStats();
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    fetchStats();
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'products':
        return (
          <>
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-gray-600">Manage your product inventory</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                    disabled={isLoadingStats}
                  >
                    <FiRefreshCw size={18} className={isLoadingStats ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setShowBulkUploadModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    <FiPlus size={18} />
                    Bulk Upload
                  </button>
                </div>
              </div>
            </div>
            {(() => {
              const categoryId = searchParams.get('category');
              const categoryName = searchParams.get('categoryName');
              return (
                <ProductsTable
                  key={`${refreshKey}-${categoryId}-${categoryName}`}
                  categoryId={categoryId}
                  categoryName={categoryName}
                  onRefresh={handleRefresh}
                />
              );
            })()}
            <BulkUploadModal
              isOpen={showBulkUploadModal}
              onClose={() => setShowBulkUploadModal(false)}
              onUploadComplete={handleUploadComplete}
            />
          </>
        );
      case 'categories':
        return <CategoriesPage />;
      case 'orders':
        return <StoreAdminOrdersListPage />;
      case 'customers':
        return <CustomersPage />;
      case 'landing':
        return <LandingPageManager />;
      case 'notification-bar':
        return <NotificationBarPage />;
      case 'category-section':
        return <CategorySectionSettingsPage />;
      default:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome, {admin?.firstName || 'Store Admin'}! 👋</h1>
              <p className="text-gray-600 text-lg mb-6">
                You're logged into <span className="font-semibold">{admin?.storeName || 'Your Store'}</span>
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 mb-2">📦 Products</h3>
                  <p className="text-gray-600 text-sm">Manage and organize your product catalog</p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 mb-2">📂 Categories</h3>
                  <p className="text-gray-600 text-sm">Organize products into categories</p>
                </div>
                
                <div className="border-l-4 border-purple-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 mb-2">📋 Orders</h3>
                  <p className="text-gray-600 text-sm">View and manage customer orders</p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900 mb-2">👥 Customers</h3>
                  <p className="text-gray-600 text-sm">Manage your customer list</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mt-8">Use the sidebar menu to navigate and manage your store.</p>
            </div>
          </div>
        );
    }
  };
  return <>{renderPage()}</>;
}