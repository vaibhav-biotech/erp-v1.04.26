'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiTrendingUp, FiUsers, FiShoppingCart, FiCheckSquare, FiPhoneCall, FiPercent } from 'react-icons/fi';
import { buildApiUrl } from '@/lib/storeConfig';

interface StaffStat {
  name: string;
  username: string;
  storeName: string;
  totalTasks: number;
  completedTasks: number;
  totalCalls: number;
  convertedCalls: number;
}

interface AnalyticsData {
  global: {
    totalTasks: number;
    completedTasks: number;
    totalCalls: number;
    convertedCalls: number;
  };
  leaderboard: StaffStat[];
}

interface DashboardStats {
  totalStores: number;
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [stores, setStores] = useState<string[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const headers = {
          Authorization: `Bearer ${localStorage.getItem('superadmin_token')}`
        };
        const [staffRes, dashboardRes] = await Promise.all([
          fetch(buildApiUrl('/api/superadmin/staff-analytics'), { headers }),
          fetch(buildApiUrl('/api/superadmin/dashboard-stats'), { headers })
        ]);
        
        const staffJson = await staffRes.json();
        const dashboardJson = await dashboardRes.json();

        if (staffJson.success) {
          setData(staffJson.data);
          const uniqueStores = Array.from(new Set(staffJson.data.leaderboard.map((s: StaffStat) => s.storeName)));
          setStores(uniqueStores as string[]);
        }
        
        if (dashboardJson.success) {
          setDashboardStats(dashboardJson.data);
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = [
    {
      label: 'Total Customers',
      value: loading ? '...' : (dashboardStats?.totalCustomers || 0).toLocaleString(),
      icon: <FiUsers className="w-8 h-8" />,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Orders',
      value: loading ? '...' : (dashboardStats?.totalOrders || 0).toLocaleString(),
      icon: <FiShoppingCart className="w-8 h-8" />,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Revenue',
      value: loading ? '...' : `₹${(dashboardStats?.totalRevenue || 0).toLocaleString()}`,
      icon: <FiTrendingUp className="w-8 h-8" />,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Active Stores',
      value: loading ? '...' : (dashboardStats?.totalStores || stores.length || 0).toString(),
      icon: <FiBarChart2 className="w-8 h-8" />,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  const filteredLeaderboard = data?.leaderboard.filter(
    (s) => selectedStore === 'all' || s.storeName === selectedStore
  ) || [];

  const displayGlobal = {
    totalTasks: filteredLeaderboard.reduce((acc, s) => acc + s.totalTasks, 0),
    completedTasks: filteredLeaderboard.reduce((acc, s) => acc + s.completedTasks, 0),
    totalCalls: filteredLeaderboard.reduce((acc, s) => acc + s.totalCalls, 0),
    convertedCalls: filteredLeaderboard.reduce((acc, s) => acc + s.convertedCalls, 0),
  };

  const taskCompletionRate = displayGlobal.totalTasks > 0 
    ? Math.round((displayGlobal.completedTasks / displayGlobal.totalTasks) * 100) 
    : 0;
    
  const callConversionRate = displayGlobal.totalCalls > 0 
    ? Math.round((displayGlobal.convertedCalls / displayGlobal.totalCalls) * 100) 
    : 0;

  const staffStats = [
    {
      label: 'Total Tasks Assigned',
      value: displayGlobal.totalTasks.toString(),
      icon: <FiCheckSquare className="w-8 h-8" />,
      color: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      label: 'Task Completion',
      value: `${taskCompletionRate}%`,
      icon: <FiPercent className="w-8 h-8" />,
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Total Calls Made',
      value: displayGlobal.totalCalls.toString(),
      icon: <FiPhoneCall className="w-8 h-8" />,
      color: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      label: 'Call Conversion',
      value: `${callConversionRate}%`,
      icon: <FiTrendingUp className="w-8 h-8" />,
      color: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiBarChart2 className="text-green-600 w-8 h-8" />
          <div>
            <h1 className="font-playfair text-3xl text-gray-900">Analytics</h1>
            <p className="font-montserrat text-sm text-gray-600">
              System-wide statistics and insights
            </p>
          </div>
        </div>
        
        {/* Store Filter */}
        <div>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:border-black focus:ring-black sm:text-sm px-4 py-2 bg-white"
          >
            <option value="all">All Stores</option>
            {stores.map(store => (
              <option key={store} value={store}>{store}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.color} rounded-lg p-6 shadow-sm border border-gray-200`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-montserrat text-sm text-gray-600 mb-2">{stat.label}</p>
                <p className="font-playfair text-2xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.iconColor}`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Staff Stats Grid */}
      <h2 className="font-playfair text-2xl font-bold text-gray-900 mt-8 pt-4 border-t">Staff Performance Output</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {staffStats.map((stat, index) => (
          <motion.div
            key={`staff-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className={`${stat.color} rounded-lg p-6 shadow-sm border border-gray-200`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-montserrat text-sm text-gray-600 mb-2">{stat.label}</p>
                <p className="font-playfair text-2xl font-bold text-gray-900">
                  {loading ? '...' : stat.value}
                </p>
              </div>
              <div className={`${stat.iconColor}`}>
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Staff Leaderboard */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
          <h2 className="font-playfair text-lg font-bold text-gray-900">Staff Leaderboard</h2>
          <p className="font-montserrat text-sm text-gray-500 mt-1">Ranking of staff productivity by tasks and calls.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tasks Done / Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calls Conv / Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Perf</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 font-montserrat text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading performance data...</td>
                </tr>
              ) : filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">No staff performance data available.</td>
                </tr>
              ) : (
                filteredLeaderboard.map((staff, idx) => {
                  const rate = staff.totalTasks > 0 ? (staff.completedTasks / staff.totalTasks) * 100 : 0;
                  let colorClass = 'bg-red-500';
                  if (rate >= 80) colorClass = 'bg-green-500';
                  else if (rate >= 50) colorClass = 'bg-yellow-500';

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{staff.name}</div>
                        <div className="text-gray-500 text-xs">@{staff.username}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {staff.storeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold">{staff.completedTasks}</span> / {staff.totalTasks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold">{staff.convertedCalls}</span> / {staff.totalCalls}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px]">
                            <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${rate}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500">{Math.round(rate)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
