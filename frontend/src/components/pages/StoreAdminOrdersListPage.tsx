'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FiEye, FiRefreshCw } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

interface Order {
  _id: string;
  orderNumber?: string;
  orderId?: string;
  customerId: string;
  items: Array<{ quantity: number }>;
  total: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt: string;
}

const titleize = (value: string) =>
  String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'processing':
      return 'bg-indigo-100 text-indigo-700';
    case 'packed':
      return 'bg-cyan-100 text-cyan-700';
    case 'confirmed':
      return 'bg-blue-100 text-blue-700';
    case 'shipped':
      return 'bg-purple-100 text-purple-700';
    case 'out_for_delivery':
      return 'bg-orange-100 text-orange-700';
    case 'delivered':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    case 'returned':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
};

const getPaymentBadge = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    case 'refunded':
      return 'bg-gray-200 text-gray-700';
    case 'cod_pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

export default function StoreAdminOrdersListPage() {
  const { adminToken } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const revenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    [orders]
  );

  const summary = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter((o) => (o.orderStatus || 'pending') === 'pending').length,
      inTransit: orders.filter((o) => ['shipped', 'out_for_delivery'].includes(o.orderStatus || '')).length,
      delivered: orders.filter((o) => (o.orderStatus || '') === 'delivered').length,
    }),
    [orders]
  );

  const fetchOrders = async (refresh = false) => {
    if (!adminToken) return;

    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      setError('');
      const response = await fetch(buildApiUrl('/api/orders'), {
        headers: getApiHeaders(adminToken),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load orders');
      }

      setOrders(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [adminToken]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600 mt-1">Click view to open complete order details page</p>
        </div>
        <button
          onClick={() => fetchOrders(true)}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">Total</p>
          <p className="text-2xl font-bold mt-2">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-2">{summary.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">In Transit</p>
          <p className="text-2xl font-bold text-purple-700 mt-2">{summary.inTransit}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">Delivered</p>
          <p className="text-2xl font-bold text-green-700 mt-2">{summary.delivered}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs uppercase text-gray-500 font-semibold">Revenue</p>
          <p className="text-2xl font-bold text-green-700 mt-2">₹{revenue.toFixed(2)}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-600">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-600">No orders found yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Order</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Customer</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Items</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Total</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Order Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Payment</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Placed On</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const orderCode = order.orderNumber || order.orderId || order._id;
                  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                  const orderStatus = order.orderStatus || 'pending';
                  const paymentStatus = order.paymentStatus || 'pending';

                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">{orderCode}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{order.customerId}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">{itemCount}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(orderStatus)}`}>
                          {titleize(orderStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getPaymentBadge(paymentStatus)}`}>
                          {titleize(paymentStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/dashboard/store-admin/orders/${order._id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
                        >
                          <FiEye size={13} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
