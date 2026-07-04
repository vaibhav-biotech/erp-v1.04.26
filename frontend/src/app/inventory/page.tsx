'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { FiPlus, FiRefreshCw, FiTrendingUp, FiBox, FiUsers, FiShoppingCart, FiBarChart2 } from 'react-icons/fi';

import ProductsTable from '@/components/ProductsTable';
import CategoriesPage from '@/components/pages/CategoriesPage';
import StoreAdminOrdersListPage from '@/components/pages/StoreAdminOrdersListPage';
import CustomersPage from '@/components/pages/CustomersPage';
import LandingPageManager from '@/components/pages/LandingPageManager';
import NotificationBarPage from '@/components/pages/NotificationBarPage';
import CategorySectionSettingsPage from '@/components/pages/CategorySectionSettingsPage';
import FeaturedCollectionsSettingsPage from '@/components/pages/FeaturedCollectionsSettingsPage';
import GiftSectionSettingsPage from '@/components/pages/GiftSectionSettingsPage';
import CareSectionSettingsPage from '@/components/pages/CareSectionSettingsPage';
import WebsiteSettingsPage from '@/components/pages/WebsiteSettingsPage';
import GiftWrapSettingsPage from '@/components/pages/GiftWrapSettingsPage';
import AccountTaxSettingsPage from '@/components/pages/AccountTaxSettingsPage';
import OffersManager from '@/components/pages/OffersManager';
import OfferBackgroundManager from '@/components/pages/OfferBackgroundManager';
import InventoryAdminDashboard from '@/components/InventoryAdminDashboard';
import InventoryTable from '@/components/InventoryTable';
import ActivityLogPage from '@/components/pages/ActivityLogPage';

const BulkUploadModal = dynamic(() => import('@/components/BulkUploadModal'), { ssr: false });

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
}

interface StoreInfo {
  _id: string;
  name: string;
  domain: string;
  primaryColor: string;
}

export default function InventoryAdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { admin, adminToken, adminAuthenticated, logoutAdmin } = useAuth();
  
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState('home');

  // Redirect if not authenticated or not inventory admin/super admin
  useEffect(() => {
    if (!adminAuthenticated || (admin?.role !== 'inventory_admin' && admin?.role !== 'super_admin')) {
      router.push('/inventory/login');
    }
  }, [adminAuthenticated, admin, router]);

  // Get page from URL search params
  useEffect(() => {
    const page = searchParams.get('page') || 'home';
    setCurrentPage(page);
  }, [searchParams]);

  // Fetch store info on load
  useEffect(() => {
    if (admin?.role === 'inventory_admin' && adminToken) {
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
      const response = await fetch(buildApiUrl('/api/admin/dashboard-stats'), {
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
        const json = await response.json();
        if (json.success) {
          setStats({
            totalProducts: json.data.totalProducts || 0,
            totalCustomers: json.data.totalCustomers || 0,
            totalOrders: json.data.totalOrders || 0,
            totalRevenue: json.data.totalRevenue || 0
          });
        }
      }
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
      case 'inventory':
        return <InventoryTable />;
      case 'activity-log':
        return <ActivityLogPage />;

      case 'categories':
        return <CategoriesPage />;
      case 'orders':
        return <StoreAdminOrdersListPage />;
      case 'customers':
        return <CustomersPage />;
      case 'landing':
        return <LandingPageManager />;
      case 'offers':
        return (
          <div className="space-y-6">
            <OfferBackgroundManager />
            <OffersManager />
          </div>
        );
      case 'notification-bar':
        return <NotificationBarPage />;
      case 'category-section':
        return <CategorySectionSettingsPage />;
      case 'featured-collections':
        return <FeaturedCollectionsSettingsPage />;
      case 'gift-section':
        return <GiftSectionSettingsPage />;
      case 'care-section':
        return <CareSectionSettingsPage />;
      case 'website-settings':
        return <WebsiteSettingsPage />;
      case 'gift-wrap':
        return <GiftWrapSettingsPage />;
      case 'account-tax':
        return <AccountTaxSettingsPage />;

      default:
        return <InventoryAdminDashboard />;
    }
  };
  return <>{renderPage()}</>;
}