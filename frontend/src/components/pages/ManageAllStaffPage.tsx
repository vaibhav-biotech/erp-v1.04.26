'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiBriefcase, FiPlus, FiX } from 'react-icons/fi';
import DataTable, { Column } from '@/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { buildApiUrl } from '@/lib/storeConfig';

interface Staff {
  _id: string;
  name: string;
  username: string;
  role: string;
  jobRoles: string[];
  storeName: string;
  active: boolean;
  createdAt: string;
}

export default function ManageAllStaffPage() {
  const { adminToken } = useAuth();
  const router = useRouter();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'sales',
    storeName: '',
    status: 'active'
  });

  useEffect(() => {
    fetchStaff();
  }, [adminToken]);

  const fetchStaff = async () => {
    try {
      if (!adminToken) return;
      const res = await fetch(buildApiUrl('/api/superadmin/staff'), {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const json = await res.json();
      if (json.success) {
        setStaffList(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch staff', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (staff?: Staff) => {
    setError('');
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        username: staff.username,
        password: '', // Blank for security; only update if user types something
        role: staff.jobRoles && staff.jobRoles[0] ? staff.jobRoles[0] : 'sales',
        storeName: staff.storeName,
        status: staff.active ? 'active' : 'inactive'
      });
    } else {
      setEditingStaff(null);
      setFormData({
        name: '',
        username: '',
        password: '',
        role: 'sales',
        storeName: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStaff(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const url = editingStaff 
        ? buildApiUrl(`/api/superadmin/staff/${editingStaff._id}`)
        : buildApiUrl('/api/superadmin/staff');
        
      const method = editingStaff ? 'PUT' : 'POST';
      
      const body: any = { ...formData };
      // If editing and password is blank, don't send it so it stays unchanged
      if (editingStaff && !body.password) {
        delete body.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}` 
        },
        body: JSON.stringify(body)
      });
      
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save staff member');
      }

      await fetchStaff();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/api/superadmin/staff/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const json = await res.json();
      if (json.success) {
        await fetchStaff();
      } else {
        alert(json.error || 'Failed to delete staff member');
      }
    } catch (err) {
      console.error('Failed to delete staff', err);
      alert('An error occurred while deleting.');
    }
  };

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'username',
      label: 'Username',
    },
    {
      key: 'jobRoles',
      label: 'Role',
      render: (value, row: any) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {value && value[0] ? String(value[0]).replace('_', ' ').toUpperCase() : 'N/A'}
          </span>
          {row.role === 'store_admin' && (
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 shadow-sm border border-purple-200">
              STORE ADMIN
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'storeName',
      label: 'Store',
      render: (value) => value || 'Unassigned',
    },
    {
      key: 'active',
      label: 'Status',
      render: (value) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
          value === true ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {value ? 'ACTIVE' : 'SUSPENDED'}
        </span>
      ),
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FiBriefcase className="text-blue-600 w-8 h-8" />
          <div>
            <h1 className="font-playfair text-3xl text-gray-900">Manage All Staff</h1>
            <p className="font-montserrat text-sm text-gray-600">
              Manage staff members across all stores.
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium"
        >
          <FiPlus size={18} />
          Add Staff
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading staff directory...</div>
      ) : (
        <DataTable
          columns={columns}
          data={staffList}
          actions={true}
          onEdit={(row: any) => handleOpenModal(row)}
          onDelete={(id) => handleDelete(id)}
          onView={(row: any) => router.push(`/admin/dashboard/super-admin/manage-staff/${row._id}`)}
          selectable={false}
        />
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingStaff && <span className="text-gray-400 font-normal">(Leave blank to keep unchanged)</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingStaff}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder={editingStaff ? "••••••••" : "Enter a secure password"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    required
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  >
                    <option value="sales">Sales</option>
                    <option value="packaging">Packaging</option>
                    <option value="customer_service">Customer Service</option>
                    <option value="social_media">Social Media</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Assignment (Identifier)</label>
                  <input
                    type="text"
                    value={formData.storeName}
                    onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="e.g. plantsingarden (Leave blank for unassigned)"
                  />
                  <p className="mt-1 text-xs text-gray-500">The storeName identifier the staff belongs to.</p>
                </div>
                
                {editingStaff && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Save Staff'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
