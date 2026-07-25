'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiKey, FiX, FiSettings } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

export default function SuperAdminSettingsPage() {
  const { adminToken } = useAuth();
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState({ email: '', newPassword: '', userType: 'admin' });
  const [resetStatus, setResetStatus] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetStatus('');
    try {
      const res = await fetch(buildApiUrl('/api/superadmin/reset-password'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify(resetData)
      });
      const json = await res.json();
      if (json.success) {
        setResetStatus('✅ Password reset successfully');
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetStatus('');
          setResetData({ email: '', newPassword: '', userType: 'admin' });
        }, 2000);
      } else {
        setResetStatus(`❌ Error: ${json.error}`);
      }
    } catch (err) {
      setResetStatus('❌ Request failed');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-3">
        <FiSettings className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="font-playfair text-3xl text-gray-900">Settings</h1>
          <p className="font-montserrat text-sm text-gray-600">
            System settings, administration, and security.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Security & Administration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            href="?page=manage-admins"
            className="p-6 border border-gray-200 rounded-lg hover:shadow-md hover:border-purple-300 transition-all group flex flex-col items-start bg-gray-50 hover:bg-white"
          >
            <div className={`text-purple-600 mb-4 bg-purple-100 p-3 rounded-full group-hover:scale-110 transition-transform`}>
              <FiUsers className="w-6 h-6" />
            </div>
            <h3 className="font-montserrat font-semibold text-lg text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
              Manage Admins
            </h3>
            <p className="text-sm text-gray-500">Create and manage super admin and store admin accounts.</p>
          </a>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="p-6 border border-gray-200 rounded-lg hover:shadow-md hover:border-red-300 transition-all group flex flex-col items-start bg-gray-50 hover:bg-white text-left"
          >
            <div className={`text-red-600 mb-4 bg-red-100 p-3 rounded-full group-hover:scale-110 transition-transform`}>
              <FiKey className="w-6 h-6" />
            </div>
            <h3 className="font-montserrat font-semibold text-lg text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
              Force Password Reset
            </h3>
            <p className="text-sm text-gray-500">Force reset password for any user account (Admin, Staff, or Customer).</p>
          </button>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Force Password Reset</h2>
              <button onClick={() => setIsResetModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select 
                  className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={resetData.userType}
                  onChange={e => setResetData({...resetData, userType: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email / Username</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="user@example.com"
                  value={resetData.email}
                  onChange={e => setResetData({...resetData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input 
                  type="text" 
                  required
                  className="w-full border rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="New strong password"
                  value={resetData.newPassword}
                  onChange={e => setResetData({...resetData, newPassword: e.target.value})}
                />
              </div>

              {resetStatus && (
                <div className={`p-3 rounded-md text-sm ${resetStatus.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {resetStatus}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-red-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Resetting...' : 'Force Reset Password'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
