'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import DataTable, { Column } from '@/components/DataTable';

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
  const [admins] = useState<Admin[]>([
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'store_admin',
      storeName: 'Main Store',
      createdAt: '2024-01-15',
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: 'store_admin',
      storeName: 'Downtown Store',
      createdAt: '2024-02-20',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                placeholder="John"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block font-montserrat text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                placeholder="Store Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
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
              onClick={() => setShowAddForm(false)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-montserrat text-sm"
            >
              Create Admin
            </button>
          </div>
        </motion.div>
      )}

      {/* Admins Table */}
      <DataTable
        columns={columns}
        data={admins}
        actions={true}
        onDelete={handleDelete}
        onEdit={handleEdit}
        selectable={false}
      />
    </motion.div>
  );
}
