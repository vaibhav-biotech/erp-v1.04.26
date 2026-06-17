'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiShoppingBag, FiGlobe } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

interface Store {
  _id: string;
  name: string;
  storeName: string;
  domain: string;
  status: string;
}

export default function ManageStoresPage() {
  const { adminToken } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', storeName: '', domain: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStores();
  }, [adminToken]);

  const fetchStores = async () => {
    try {
      if (!adminToken) return;
      const res = await fetch(buildApiUrl('/api/superadmin/stores'), {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const json = await res.json();
      if (json.success) {
        setStores(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch stores', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/api/superadmin/stores'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}` 
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        setStores([json.data, ...stores]);
        setShowAddForm(false);
        setFormData({ name: '', storeName: '', domain: '' });
      } else {
        setError(json.error || 'Failed to create store');
      }
    } catch (err) {
      setError('An error occurred while creating the store');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading stores...</div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-sm">
        <div>
          <h1 className="text-2xl font-playfair font-bold text-gray-900">Manage Stores</h1>
          <p className="text-gray-500 text-sm mt-1">Add and manage tenant stores on the platform.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> {showAddForm ? 'Cancel' : 'Add Store'}
        </button>
      </div>

      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAddStore}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
        >
          <h2 className="text-lg font-semibold mb-4">Create New Store</h2>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Plants in Garden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Identifier (Slug)</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. plantsingarden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain (Optional)</label>
              <input
                type="text"
                value={formData.domain}
                onChange={e => setFormData({ ...formData, domain: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. plantingarden.com"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </motion.form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map(store => (
          <motion.div
            key={store._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FiShoppingBag className="w-6 h-6" />
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${store.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {store.status || 'Active'}
                </span>
              </div>
              <h3 className="font-playfair text-xl font-bold text-gray-900 mb-1">{store.name}</h3>
              <p className="text-gray-500 text-sm mb-4 font-mono">ID: {store.storeName}</p>
              
              {store.domain && (
                <div className="flex items-center text-gray-600 text-sm">
                  <FiGlobe className="mr-2 text-gray-400" />
                  <a href={`https://${store.domain}`} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">
                    {store.domain}
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {stores.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            No stores created yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}
