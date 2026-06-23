'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiBarChart2, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
}

export default function SuperAdminDashboard() {
  const { adminToken } = useAuth();
  const [dashboardStats, setDashboardStats] = useState({
    totalStores: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!adminToken) return;
        const res = await fetch(buildApiUrl('/api/superadmin/dashboard-stats'), {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });
        const json = await res.json();
        if (json.success) {
          setDashboardStats({
            totalStores: json.data.totalStores || 0,
            totalCustomers: json.data.totalCustomers || 0,
            totalOrders: json.data.totalOrders || 0,
            totalRevenue: json.data.totalRevenue || 0
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [adminToken]);

  const stats: StatCard[] = [
    {
      title: 'Total Stores',
      value: isLoading ? '...' : String(dashboardStats.totalStores),
      icon: <FiShoppingCart className="w-6 h-6" />,
    },
    {
      title: 'Total Customers',
      value: isLoading ? '...' : String(dashboardStats.totalCustomers),
      icon: <FiUsers className="w-6 h-6" />,
    },
    {
      title: 'Total Orders',
      value: isLoading ? '...' : String(dashboardStats.totalOrders),
      icon: <FiTrendingUp className="w-6 h-6" />,
    },
    {
      title: 'Total Revenue',
      value: isLoading ? '...' : `₹${dashboardStats.totalRevenue.toLocaleString('en-IN')}`,
      icon: <FiBarChart2 className="w-6 h-6" />,
    },
  ];

  const KpiCard = ({ title, value, icon }: StatCard) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-gray-400">
        {icon}
      </div>
    </div>
  );

  const quickActions = [
    { title: 'View All Customers', icon: <FiUsers className="w-5 h-5" />, color: 'text-blue-600', link: '?page=all-customers' },
    { title: 'View All Orders', icon: <FiShoppingCart className="w-5 h-5" />, color: 'text-indigo-600', link: '?page=all-orders' },
    { title: 'Manage Stores', icon: <FiShoppingCart className="w-5 h-5" />, color: 'text-green-600', link: '?page=manage-stores' },
    { title: 'Manage Admins', icon: <FiUsers className="w-5 h-5" />, color: 'text-purple-600', link: '?page=manage-admins' },
    { title: 'View All Staff', icon: <FiUsers className="w-5 h-5" />, color: 'text-blue-600', link: '?page=manage-staff' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome Header */}
      

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <KpiCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow p-6"
      >
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.link}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-green-300 transition-all group"
            >
              <div className={`${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <p className="font-montserrat text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors">
                {action.title}
              </p>
            </a>
          ))}
        </div>
      </motion.div>

      {/* System Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg shadow p-6"
      >
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-900 mb-2">🏪 Stores</h3>
            <p className="text-gray-600 text-sm">Manage multiple store accounts and their operations</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-900 mb-2">👥 Team</h3>
            <p className="text-gray-600 text-sm">Create and manage store admin accounts</p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4 py-2">
            <h3 className="font-semibold text-gray-900 mb-2">📊 Insights</h3>
            <p className="text-gray-600 text-sm">View system-wide analytics and reports</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
