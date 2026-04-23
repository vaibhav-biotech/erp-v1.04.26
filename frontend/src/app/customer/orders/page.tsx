'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import Link from 'next/link';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

export default function OrdersPage() {
  const { customer, customerToken } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customer || !customerToken) {
      router.push('/auth/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const headers = getApiHeaders(customerToken || '');
        const res = await fetch(
          buildApiUrl(`/api/orders/customer/${customer._id}`),
          { headers }
        );

        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err: any) {
        setError(err.message || 'Error loading orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [customer, customerToken, router]);

  if (!customer) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-playfair text-3xl font-bold text-black mb-2">
              My Orders
            </h1>
            <p className="text-gray-600">
              Track and manage all your orders in one place
            </p>
          </motion.div>

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-stone-50 rounded-lg p-12 text-center"
            >
              <p className="text-gray-600 mb-4">You haven't placed any orders yet.</p>
              <Link
                href="/products"
                className="inline-block bg-black text-white px-6 py-3 rounded-lg font-montserrat font-bold text-sm hover:bg-gray-900 transition"
              >
                Start Shopping
              </Link>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order, idx) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-gray-300 rounded-lg p-6 hover:shadow-lg transition"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div>
                          <p className="text-gray-600 text-sm">Order Number</p>
                          <p className="font-montserrat font-bold text-lg text-black">
                            {order.orderNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Date</p>
                          <p className="font-montserrat text-black">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 text-sm">Items</p>
                          <p className="font-montserrat font-bold text-black">
                            {order.items.length}
                          </p>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex gap-3">
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-montserrat font-semibold ${getStatusColor(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus.charAt(0).toUpperCase() +
                            order.orderStatus.slice(1)}
                        </span>
                        <span
                          className={`inline-block px-3 py-1 rounded text-xs font-montserrat font-semibold border ${getPaymentStatusColor(
                            order.paymentStatus
                          )}`}
                        >
                          Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>

                    {/* Total & Action */}
                    <div className="flex flex-col items-end gap-3">
                      <div>
                        <p className="text-gray-600 text-sm">Total</p>
                        <p className="font-montserrat font-bold text-lg text-black">
                          ₹{order.total.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <Link
                        href={`/customer/orders/${order._id}`}
                        className="bg-black text-white px-4 py-2 rounded-lg font-montserrat font-bold text-sm hover:bg-gray-900 transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
