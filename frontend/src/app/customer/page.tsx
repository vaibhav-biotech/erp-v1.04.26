'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut } from 'lucide-react';

export default function CustomerPage() {
  const router = useRouter();
  const { customer, logoutCustomer } = useAuth();

  const handleLogout = () => {
    logoutCustomer();
    router.push('/auth/login');
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair text-gray-900 mb-2">
            Welcome, {customer?.firstName}! 👋
          </h1>
          <p className="text-gray-600 font-montserrat">
            Manage your account and explore our plants collection
          </p>
        </div>

        {/* Customer Info Card */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-8 border border-green-200">
          <h2 className="text-lg font-playfair text-gray-900 mb-4">My Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-montserrat">Email</p>
              <p className="text-lg text-gray-900 font-medium">{customer?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-montserrat">Full Name</p>
              <p className="text-lg text-gray-900 font-medium">
                {customer?.firstName} {customer?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-montserrat">Phone</p>
              <p className="text-lg text-gray-900 font-medium">{customer?.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-montserrat">Account ID</p>
              <p className="text-sm text-gray-700 font-mono">{customer?._id}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <p className="font-playfair text-green-900">📦 My Orders</p>
            <p className="text-sm text-gray-600 font-montserrat">View your purchases</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <p className="font-playfair text-green-900">❤️ Wishlist</p>
            <p className="text-sm text-gray-600 font-montserrat">Saved plants</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <p className="font-playfair text-green-900">🎁 Addresses</p>
            <p className="text-sm text-gray-600 font-montserrat">Delivery locations</p>
          </motion.button>
        </div>

        {/* Logout Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-montserrat font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={20} />
          Logout
        </motion.button>
      </motion.div>
    </div>
  );
}
