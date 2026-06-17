'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import DataTable, { Column } from '@/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

interface Admin {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'store_admin' | 'super_admin';
  storeName?: string;
  createdAt: string;
}

export default function ManageAdminsPage() {
  const { adminToken } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    storeName: '',
    role: 'store_admin'
  });

  useEffect(() => {
    fetchAdmins();
  }, [adminToken]);

  const fetchAdmins = async () => {
    try {
      if (!adminToken) return;
      const res = await fetch(buildApiUrl('/api/superadmin/admins'), {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const json = await res.json();
      if (json.success) {
        setAdmins(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch admins', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/api/superadmin/admins'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}` 
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setAdmins([json.data, ...admins]);
        setShowAddForm(false);
        setFormData({ firstName: '', lastName: '', email: '', password: '', storeName: '', role: 'store_admin' });
      } else {
        setError(json.error || 'Failed to create admin');
      }
    } catch (err) {
      setError('An error occurred while creating the admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (admin: Admin) => {
    if (window.confirm(`Delete admin ${admin.firstName} ${admin.lastName}?`)) {
      // Will implement delete logic
      console.log('Delete admin:', admin._id);
    }
  };

  const handleEdit = (admin: Admin) => {
    // Will implement edit logic
    console.log('Edit admin:', admin._id);
  };

  const columns: Column[] = [
    {
      key: 'firstName',
      label: 'Name',
      render: (_, row) => `${row.firstName} ${row.lastName}`,
    },
    {
      key: 'email',
      label: 'Email',
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
          value === 'super_admin' 
            ? 'bg-purple-50 text-purple-700' 
            : 'bg-blue-50 text-blue-700'
        }`}>
          {value === 'super_admin' ? 'Super Admin' : 'Store Admin'}
        </span>
      ),
    },
    {
      key: 'storeName',
      label: 'Store',
      render: (value) => value || 'System-wide',
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => new Date(value).toLocaleDateString(),
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
          <FiUsers className="text-green-600 w-8 h-8" />
          <div>
            <h1 className="font-playfair text-3xl text-gray-900">Manage Admins</h1>
            <p className="font-montserrat text-sm text-gray-600">
              Create and manage store admin accounts
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-montserrat text-sm"
        >
          <FiPlus className="w-5 h-5" />
          Add Admin
        </button>
      </div>

      {/* Add Admin Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                Store Name (Slug)
              </label>
              <input
                type="text"
                placeholder="plantsingarden"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              >
                <option value="store_admin">Store Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-montserrat text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAdmin}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-montserrat text-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Admin'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Admins Table */}
      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading admins...</div>
      ) : (
        <DataTable
          columns={columns}
          data={admins}
          actions={true}
          onDelete={handleDelete}
          onEdit={handleEdit}
          selectable={false}
        />
      )}
    </motion.div>
  );
}
