"use client";
import React, { useState, useEffect } from 'react';

export default function AccountsDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStore, setSelectedStore] = useState('All Stores');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/accounts/dashboard');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to load stats');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Accounts Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Collected</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats?.revenue?.totalCollected?.toLocaleString() || 0}</h3>
          </div>
        </div>

        {/* Pending Revenue Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Pending Collection</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">₹{stats?.revenue?.pendingCollection?.toLocaleString() || 0}</h3>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Store Orders</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.orders?.total || 0}</h3>
          </div>
        </div>

        {/* Invoices Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Invoices</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats?.invoices?.total || 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Breakdown</h2>
          <div className="space-y-3 flex-grow">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 text-sm font-medium">Paid Orders</span>
              <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-sm">{stats?.orders?.paid || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 text-sm font-medium">Pending Payments</span>
              <span className="text-amber-600 font-bold bg-amber-100 px-2 py-1 rounded text-sm">{stats?.orders?.pending || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Fulfillment</h2>
            {stats?.orders?.storeStatuses && Object.keys(stats.orders.storeStatuses).length > 0 && (
              <select 
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="text-xs border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-0 focus:border-gray-300"
              >
                <option value="All Stores">All Stores</option>
                {Object.keys(stats.orders.storeStatuses).map(storeName => (
                  <option key={storeName} value={storeName}>{storeName}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-2 flex-grow">
            {(() => {
              const displayStats = selectedStore === 'All Stores' 
                ? stats?.orders?.statuses 
                : stats?.orders?.storeStatuses?.[selectedStore];

              const totalStoreOrders = selectedStore === 'All Stores'
                ? stats?.orders?.total
                : stats?.orders?.storeStatuses?.[selectedStore]?.total;

              return (
                <>
                  <div className="bg-gray-50 p-2 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Total</p>
                    <p className="text-lg font-bold text-gray-900">{totalStoreOrders || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase text-yellow-600 font-bold">Pending</p>
                    <p className="text-lg font-bold text-yellow-700">{displayStats?.pending || 0}</p>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase text-indigo-600 font-bold">Processing</p>
                    <p className="text-lg font-bold text-indigo-700">{displayStats?.processing || 0}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase text-blue-600 font-bold">Shipped</p>
                    <p className="text-lg font-bold text-blue-700">{displayStats?.shipped || 0}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase text-green-600 font-bold">Delivered</p>
                    <p className="text-lg font-bold text-green-700">{displayStats?.delivered || 0}</p>
                  </div>
                  <div className="bg-red-50 p-2 rounded-lg text-center flex flex-col justify-center">
                    <p className="text-[10px] uppercase text-red-600 font-bold">Cancelled</p>
                    <p className="text-lg font-bold text-red-700">{displayStats?.cancelled || 0}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Procurement</h2>
          <div className="space-y-3 flex-grow">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 text-sm font-medium">Purchase Orders</span>
              <span className="text-gray-900 font-bold bg-white px-2 py-1 rounded text-sm border border-gray-200">{stats?.purchaseOrders?.total || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-gray-600 text-sm font-medium">Active Suppliers</span>
              <span className="text-gray-900 font-bold bg-white px-2 py-1 rounded text-sm border border-gray-200">{stats?.suppliers?.total || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
