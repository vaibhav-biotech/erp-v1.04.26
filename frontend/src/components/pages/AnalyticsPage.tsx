'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiBarChart2, FiTrendingUp, FiUsers, FiShoppingCart } from 'react-icons/fi';

export default function AnalyticsPage() {
  const stats = [
    {
      label: 'Total Customers',
      value: '1,234',
      icon: <FiUsers className="w-8 h-8" />,
      color: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Total Orders',
      value: '567',
      icon: <FiShoppingCart className="w-8 h-8" />,
      color: 'bg-green-50',
      iconColor: 'text-green-600',
    },
    {
      label: 'Revenue',
      value: '₹2,45,890',
      icon: <FiTrendingUp className="w-8 h-8" />,
      color: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      label: 'Active Stores',
      value: '3',
      icon: <FiBarChart2 className="w-8 h-8" />,
      color: 'bg-orange-50',
      iconColor: 'text-orange-600',
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
      </div>

      {/* Stats Grid */}
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

      {/* Placeholder Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <h2 className="font-playfair text-lg font-bold text-gray-900 mb-4">
            Monthly Revenue
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
            <p className="font-montserrat text-gray-500">Chart coming soon</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <h2 className="font-playfair text-lg font-bold text-gray-900 mb-4">
            Top Performing Stores
          </h2>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded border border-gray-200">
            <p className="font-montserrat text-gray-500">Chart coming soon</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
