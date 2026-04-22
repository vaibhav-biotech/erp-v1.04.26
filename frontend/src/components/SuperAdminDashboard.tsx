'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiBarChart2, FiShoppingCart, FiTrendingUp } from 'react-icons/fi';

interface StatCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
}

export default function SuperAdminDashboard() {
  const stats: StatCard[] = [
    {
      title: 'Total Stores',
      value: '3',
      icon: <FiShoppingCart className="w-8 h-8" />,
      color: 'bg-blue-50',
      borderColor: 'border-blue-500',
    },
    {
      title: 'Total Customers',
      value: '1,234',
      icon: <FiUsers className="w-8 h-8" />,
      color: 'bg-green-50',
      borderColor: 'border-green-500',
    },
    {
      title: 'Total Orders',
      value: '567',
      icon: <FiTrendingUp className="w-8 h-8" />,
      color: 'bg-purple-50',
      borderColor: 'border-purple-500',
    },
    {
      title: 'Total Revenue',
      value: '₹2,45,890',
      icon: <FiBarChart2 className="w-8 h-8" />,
      color: 'bg-orange-50',
      borderColor: 'border-orange-500',
    },
  ];

  const quickActions = [
    { title: 'View All Customers', icon: <FiUsers className="w-5 h-5" />, color: 'text-blue-600', link: '?page=all-customers' },
    { title: 'Analytics', icon: <FiBarChart2 className="w-5 h-5" />, color: 'text-green-600', link: '?page=analytics' },
    { title: 'Manage Admins', icon: <FiUsers className="w-5 h-5" />, color: 'text-purple-600', link: '?page=manage-admins' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-8 text-white">
        <h1 className="font-playfair text-4xl font-bold mb-2">Welcome, Super Admin 🔐</h1>
        <p className="font-montserrat text-green-50 text-lg">
          You have full system access. Manage all stores, customers, and admins from here.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.color} rounded-lg shadow p-6 border-l-4 ${stat.borderColor}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-montserrat text-sm text-gray-600 mb-2">{stat.title}</p>
                <p className="font-playfair text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className="text-gray-400">
                {stat.icon}
              </div>
            </div>
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
        <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-4">System Overview</h2>
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
