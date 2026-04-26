'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUsers } from 'react-icons/fi';
import DataTable, { Column } from '@/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface Customer {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  store?: string;
  createdAt: string;
}

export default function AllCustomersPage() {
  const { adminToken } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [stores, setStores] = useState<string[]>([]);

  useEffect(() => {
    fetchCustomers();
  }, [adminToken]);

  const fetchCustomers = async () => {
    if (!adminToken) {
      setError('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      const headers = getApiHeaders(adminToken);
      const response = await fetch(buildApiUrl('/api/customers/all'), {
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setCustomers(data.data || []);
        // Extract unique stores
        const uniqueStores = [...new Set((data.data || []).map((c: Customer) => c.store))].filter(Boolean) as string[];
        setStores(uniqueStores);
        setFilteredCustomers(data.data || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch customers');
        console.error('API Error:', data);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error fetching customers';
      setError(errorMsg);
      console.error('Fetch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoreFilter = (store: string) => {
    setSelectedStore(store);
    if (store === 'all') {
      setFilteredCustomers(customers);
    } else {
      setFilteredCustomers(customers.filter(c => c.store === store));
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    if (!adminToken) return;

    try {
      const headers = getApiHeaders(adminToken);
      const response = await fetch(buildApiUrl(`/api/customers/${customer._id}`), {
        method: 'DELETE',
        headers,
      });
      const data = await response.json();

      if (data.success) {
        setCustomers(customers.filter((c) => c._id !== customer._id));
        setFilteredCustomers(filteredCustomers.filter((c) => c._id !== customer._id));
      } else {
        setError(data.message || 'Failed to delete customer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting customer');
    }
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
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'store',
      label: 'Store',
      render: (value) => (
        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
          {value || 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-montserrat text-gray-600">Loading all customers...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="font-playfair text-3xl text-gray-900">All Customers</h1>
            <p className="font-montserrat text-sm text-gray-600">
              Total: {filteredCustomers.length} / {customers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="font-montserrat text-sm text-red-700">{error}</p>
        </motion.div>
      )}

      {/* Store Filter */}
      {stores.length > 0 && (
        <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow">
          <label className="font-montserrat text-sm font-medium text-gray-700">Filter by Store:</label>
          <select
            value={selectedStore}
            onChange={(e) => handleStoreFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg font-montserrat text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="all">All Stores ({customers.length})</option>
            {stores.map(store => {
              const count = customers.filter(c => c.store === store).length;
              return (
                <option key={store} value={store}>{store} ({count})</option>
              );
            })}
          </select>
        </div>
      )}

      {/* Table */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="font-montserrat text-gray-600">No customers found</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCustomers}
          actions={true}
          onDelete={handleDelete}
          selectable={false}
        />
      )}
    </motion.div>
  );
}
