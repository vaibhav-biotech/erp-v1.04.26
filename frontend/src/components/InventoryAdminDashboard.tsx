'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBox, FiPackage, FiDollarSign, FiTrendingUp, FiAlertTriangle, FiXCircle, FiLock, FiCheckCircle, FiShare2, FiBell } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

export default function InventoryAdminDashboard() {
  const { adminToken } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const url = buildApiUrl('/api/inventory/stats');
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });
        
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            setDashboardStats(json.data);
          }
        }
      } catch (error) {
        console.error('Error fetching inventory dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (adminToken) {
      fetchStats();
    }
  }, [adminToken]);

  if (isLoading || !dashboardStats) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  }

  // Premium small card component
  const KpiCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: any }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-gray-400">
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Row 1: Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Total Products" value={dashboardStats.totalProducts.toLocaleString()} icon={FiBox} />
        <KpiCard title="Current Stock" value={`${dashboardStats.stockUnits.toLocaleString()} Units`} icon={FiPackage} />
        <KpiCard title="Inventory Value" value={`₹${dashboardStats.inventoryValue.toLocaleString('en-IN')}`} icon={FiDollarSign} />
        <KpiCard title="Stock Value" value={`₹${dashboardStats.stockValue.toLocaleString('en-IN')}`} icon={FiTrendingUp} />
      </div>

      {/* Row 2: Stock Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Low Stock" value={dashboardStats.lowStockCount.toLocaleString()} icon={FiAlertTriangle} />
        <KpiCard title="Out of Stock" value={dashboardStats.outOfStockCount.toLocaleString()} icon={FiXCircle} />
        <KpiCard title="Reserved Stock" value={`${dashboardStats.reservedStock.toLocaleString()} Units`} icon={FiLock} />
        <KpiCard title="Available Stock" value={`${dashboardStats.availableStock.toLocaleString()} Units`} icon={FiCheckCircle} />
      </div>

      {/* Row 3: Performance & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Potential Profit" value={`₹${dashboardStats.potentialGrossProfit.toLocaleString('en-IN')}`} icon={FiTrendingUp} />
        <KpiCard title="Stock Alerts" value={dashboardStats.stockAlerts.toLocaleString()} icon={FiBell} />
        <KpiCard title="Shared Products" value={dashboardStats.sharedProducts.toLocaleString()} icon={FiShare2} />
        <KpiCard title="Turnover (MTD)" value={`${dashboardStats.inventoryTurnover.toLocaleString()} Units`} icon={FiTrendingUp} />
      </div>

      {/* Bottom Layout: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 */}
        <div className="space-y-6">
          {/* Top Inventory Value */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Top Inventory Value</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardStats.tables?.topInventoryValue.map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-gray-600">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Category Distribution</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardStats.tables?.categoryDistribution.map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-6">
          {/* Low Stock Products */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <FiAlertTriangle className="text-yellow-500" /> Low Stock
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardStats.tables?.lowStockProducts.map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-yellow-700 font-semibold">{item.stock} Units</span>
                </div>
              ))}
              {dashboardStats.tables?.lowStockProducts.length === 0 && (
                <div className="px-5 py-6 text-center text-gray-500 text-sm">No low stock items!</div>
              )}
            </div>
          </div>

          {/* Recently Updated */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <FiBox className="text-blue-500" /> Recently Updated
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardStats.tables?.recentlyUpdatedTable.map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className={`font-semibold ${item.delta.startsWith('+') ? 'text-green-600' : 'text-gray-600'}`}>
                    {item.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-6">
          {/* Store Coverage */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <FiShare2 className="text-indigo-500" /> Store Coverage
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardStats.tables?.storeCoverage.map((item: any, i: number) => (
                <div key={i} className="px-5 py-3 flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-800">{item.name}</span>
                  <span className="text-gray-600">{item.count} Products</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
