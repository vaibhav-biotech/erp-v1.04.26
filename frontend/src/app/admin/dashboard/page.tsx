'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiRefreshCw, FiTrendingUp } from 'react-icons/fi';
import BulkUploadModal from '@/components/BulkUploadModal';
import ProductsTable from '@/components/ProductsTable';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  draftProducts: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    inactiveProducts: 0,
    draftProducts: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const [allRes, activeRes, inactiveRes, draftRes] = await Promise.all([
        fetch('/api/products?limit=1'),
        fetch('/api/products?status=active&limit=1'),
        fetch('/api/products?status=inactive&limit=1'),
        fetch('/api/products?status=draft&limit=1')
      ]);

      const allData = await allRes.json();
      const activeData = await activeRes.json();
      const inactiveData = await inactiveRes.json();
      const draftData = await draftRes.json();

      setStats({
        totalProducts: allData.pagination.total,
        activeProducts: activeData.pagination.total,
        inactiveProducts: inactiveData.pagination.total,
        draftProducts: draftData.pagination.total
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

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your product inventory</p>
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
              onClick={() => router.push('/dashboard?page=add-product')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <FiPlus size={18} />
              Add Product
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
            </div>
            <div className="text-blue-500 opacity-20">
              <FiTrendingUp size={40} />
            </div>
          </div>
        </div>

        {/* Active Products */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeProducts}</p>
            </div>
            <div className="text-green-500 opacity-20">
              <FiTrendingUp size={40} />
            </div>
          </div>
        </div>

        {/* Inactive Products */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Inactive</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.inactiveProducts}</p>
            </div>
            <div className="text-red-500 opacity-20">
              <FiTrendingUp size={40} />
            </div>
          </div>
        </div>

        {/* Draft Products */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Draft</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.draftProducts}</p>
            </div>
            <div className="text-yellow-500 opacity-20">
              <FiTrendingUp size={40} />
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <ProductsTable key={refreshKey} onRefresh={handleRefresh} />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onUploadComplete={() => {
          setShowBulkUploadModal(false);
          setRefreshKey(prev => prev + 1);
          fetchStats();
        }}
      />
    </>
  );
}
