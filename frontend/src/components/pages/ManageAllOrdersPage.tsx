'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiEye } from 'react-icons/fi';
import DataTable, { Column } from '@/components/DataTable';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function ManageAllOrdersPage() {
  const { adminToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('/api/superadmin/orders'), {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const json = await response.json();
      if (json.success) {
        setOrders(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchOrders();
    }
  }, [adminToken]);

  const handleUpdateStatus = async (orderId: string, field: 'orderStatus' | 'paymentStatus', value: string) => {
    if (!adminToken) return;
    try {
      setUpdatingId(orderId);
      const response = await fetch(buildApiUrl(`/api/superadmin/orders/${orderId}`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [field]: value })
      });
      if(response.ok) {
        setOrders(orders.map((o) => o._id === orderId ? { ...o, [field]: value } : o));
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 text-yellow-700';
      case 'confirmed': return 'bg-blue-50 text-blue-700';
      case 'processing': return 'bg-purple-50 text-purple-700';
      case 'packed': return 'bg-indigo-50 text-indigo-700';
      case 'shipped': return 'bg-teal-50 text-teal-700';
      case 'out_for_delivery': return 'bg-orange-50 text-orange-700';
      case 'delivered': return 'bg-green-50 text-green-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      case 'returned': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const columns: Column[] = [
    { 
      key: 'orderNumber', 
      label: 'Order ID',
      render: (val: string) => <span className="font-medium text-gray-900">{val || 'N/A'}</span>
    },
    { 
      key: 'storeName', 
      label: 'Store',
      render: (val: string) => (
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold uppercase tracking-wider">
          {val || 'UNKNOWN'}
        </span>
      )
    },
    { 
      key: 'total', 
      label: 'Amount',
      render: (val: number) => <span className="font-medium text-gray-900">{formatCurrency(val || 0)}</span>
    },
    { 
      key: 'orderStatus', 
      label: 'Order Status',
      render: (val: string, row: any) => (
        <select
          value={val || 'pending'}
          disabled={updatingId === row._id}
          onChange={(e) => handleUpdateStatus(row._id, 'orderStatus', e.target.value)}
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusBadge(val)}`}
        >
          {ORDER_STATUS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
      )
    },
    { 
      key: 'paymentStatus', 
      label: 'Payment Status',
      render: (val: string, row: any) => (
        <select
          value={val || 'pending'}
          disabled={updatingId === row._id}
          onChange={(e) => handleUpdateStatus(row._id, 'paymentStatus', e.target.value)}
          className={`inline-block px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
            val === 'paid' ? 'bg-green-50 text-green-700' : 
            val === 'failed' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
          }`}
        >
          {PAYMENT_STATUS_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Date',
      render: (val: string) => <span className="text-gray-500 whitespace-nowrap">{new Date(val).toLocaleDateString()}</span>
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-playfair text-3xl text-gray-900">Manage All Orders</h1>
          <p className="font-montserrat text-sm text-gray-500 mt-1">
            Monitor and view orders across all stores in the network
          </p>
        </div>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading orders...</div>
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            actions={true}
            onView={(row) => router.push(`/superadmin/all-orders/${row._id}`)}
            selectable={false}
          />
        )}
      </div>
    </motion.div>
  );
}
