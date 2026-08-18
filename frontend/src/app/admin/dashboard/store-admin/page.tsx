'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { FiPlus, FiRefreshCw, FiTrendingUp, FiBox, FiUsers, FiShoppingCart, FiBarChart2 } from 'react-icons/fi';
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area, CartesianGrid } from 'recharts';

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
import AbandonedCartsPage from '@/components/pages/AbandonedCartsPage';

const BulkUploadModal = dynamic(() => import('@/components/BulkUploadModal'), { ssr: false });

interface DashboardStats {
  totalProducts: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  dailyRevenue: { date: string; revenue: number }[];
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
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    dailyRevenue: []
  });
  const [revenueFilter, setRevenueFilter] = useState<'weekly' | 'monthly'>('weekly');
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
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
        fetchDashboardProducts();
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
            totalRevenue: json.data.totalRevenue || 0,
            dailyRevenue: json.data.dailyRevenue || []
          });
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const getGraphData = () => {
    if (!stats.dailyRevenue || stats.dailyRevenue.length === 0) return [];
    
    const dataMap: Record<string, number> = {};
    
    stats.dailyRevenue.forEach(item => {
      const d = new Date(item.date);
      let key = '';
      if (revenueFilter === 'monthly') {
        key = d.toLocaleDateString('default', { month: 'short', year: 'numeric' });
      } else {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));
        key = weekStart.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      }
      dataMap[key] = (dataMap[key] || 0) + item.revenue;
    });

    return Object.keys(dataMap).map(key => ({
      name: key,
      revenue: dataMap[key]
    }));
  };

  const fetchDashboardProducts = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/products?limit=1000'), {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const allProducts = [...json.data];
          
          const sortedByDate = [...allProducts].sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          setRecentProducts(sortedByDate.slice(0, 5));

          const sortedByStock = [...allProducts].sort((a, b) => {
            const stockA = Number(a.stock) || 0;
            const stockB = Number(b.stock) || 0;
            return stockA - stockB;
          });
          setLowStockProducts(sortedByStock.slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard products:', error);
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
      case 'categories':
        return <CategoriesPage />;
      case 'orders':
        return <StoreAdminOrdersListPage />;
      case 'customers':
        return <CustomersPage />;
      case 'abandoned-carts':
        return <AbandonedCartsPage />;
      case 'website-settings':
        return <WebsiteSettingsPage />;
      case 'account-tax':
        return <AccountTaxSettingsPage />;
      default:
        return (
          <div className="max-w-6xl mx-auto">
            {/* Minimal Header */}
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                <p className="text-gray-500 text-sm">Track your store's performance</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Revenue */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                  <FiBarChart2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : `₹${stats.totalRevenue.toLocaleString('en-IN')}`}
                  </h3>
                </div>
              </div>
              
              {/* Total Orders */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <FiShoppingCart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total Orders</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats.totalOrders.toLocaleString()}
                  </h3>
                </div>
              </div>

              {/* Total Customers */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total Customers</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats.totalCustomers.toLocaleString()}
                  </h3>
                </div>
              </div>

              {/* Total Products */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                  <FiBox className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium mb-1">Total Products</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? '...' : stats.totalProducts.toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>

            {/* Revenue Graph */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
                <select 
                  value={revenueFilter} 
                  onChange={(e) => setRevenueFilter(e.target.value as 'weekly' | 'monthly')}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="h-72 w-full">
                {stats.dailyRevenue && stats.dailyRevenue.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getGraphData()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(val) => `₹${val}`} width={60} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                        labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                    {isLoadingStats ? 'Loading graph...' : 'No revenue data available yet.'}
                  </div>
                )}
              </div>
            </div>
            
            {/* Products Tables Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
              
              {/* Recent Products */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900">Recently Updated</h2>
                  <button
                    onClick={() => setCurrentPage('products')}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition"
                  >
                    Know More
                  </button>
                </div>
                
                <div className="overflow-x-auto flex-1">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProducts.length > 0 ? (
                        recentProducts.map((product) => (
                          <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={product.name}>{product.name}</p>
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {new Date(product.updatedAt || product.createdAt || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-600">
                              {product.stock}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">
                            {isLoadingStats ? 'Loading products...' : 'No recent products found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Low Stock Alerts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-red-600">Low Stock Alerts</h2>
                  <button
                    onClick={() => setCurrentPage('products')}
                    className="px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition"
                  >
                    Know More
                  </button>
                </div>
                
                <div className="overflow-x-auto flex-1">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.length > 0 ? (
                        lowStockProducts.map((product) => (
                          <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <p className="font-medium text-gray-900 text-sm truncate max-w-[150px]" title={product.name}>{product.name}</p>
                            </td>
                            <td className="px-3 py-2 text-xs">
                              <span className={`px-1.5 py-0.5 rounded font-medium ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {product.status || 'active'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs font-bold text-red-600">
                              {product.stock}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-sm">
                            {isLoadingStats ? 'Loading products...' : 'No low stock products found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            
            <p className="text-gray-500 text-sm text-center">Use the sidebar menu to navigate and manage your store operations.</p>
          </div>
        );
    }
  };
  return <>{renderPage()}</>;
}