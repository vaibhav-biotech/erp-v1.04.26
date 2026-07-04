'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FiEye, FiRefreshCw, FiPlus } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';
import CreateOrderModal from '@/components/CreateOrderModal';

interface Order {
  _id: string;
  orderNumber?: string;
  orderId?: string;
  customerId: string;
  customerInfo?: { firstName: string; lastName: string };
  address?: { firstName: string; lastName: string };
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
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'];

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

  const handleUpdateStatus = async (orderId: string, field: 'orderStatus' | 'paymentStatus', value: string) => {
    if (!adminToken) return;
    try {
      setUpdatingId(orderId);
      const response = await fetch(buildApiUrl(`/api/orders/${orderId}`), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken),
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

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterOrderStatus !== 'all' && (o.orderStatus || 'pending') !== filterOrderStatus) return false;
      if (filterPaymentStatus !== 'all' && (o.paymentStatus || 'pending') !== filterPaymentStatus) return false;
      
      if (filterStartDate || filterEndDate) {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);

        if (filterStartDate) {
          const start = new Date(filterStartDate);
          start.setHours(0, 0, 0, 0);
          if (orderDate < start) return false;
        }
        if (filterEndDate) {
          const end = new Date(filterEndDate);
          end.setHours(23, 59, 59, 999);
          if (orderDate > end) return false;
        }
      }
      return true;
    });
  }, [orders, filterOrderStatus, filterPaymentStatus, filterStartDate, filterEndDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Orders Overview</h2>
        <div className="flex gap-2">
          <button
            onClick={() => fetchOrders(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition"
          >
            <FiRefreshCw className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition shadow-sm"
          >
            <FiPlus />
            Create Order
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <input 
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400 w-32"
            title="Start Date"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input 
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400 w-32"
            title="End Date"
          />
        </div>
        <select 
          value={filterOrderStatus} onChange={(e) => setFilterOrderStatus(e.target.value)}
          className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400"
        >
          <option value="all">All Order Statuses</option>
          {ORDER_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{titleize(opt)}</option>)}
        </select>
        <select 
          value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}
          className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400"
        >
          <option value="all">All Payment Statuses</option>
          {PAYMENT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{titleize(opt)}</option>)}
        </select>
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
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Payment Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Placed On</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const orderCode = order.orderNumber || order.orderId || order._id;
                  const itemCount = (order.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                  const orderStatus = order.orderStatus || 'pending';
                  const paymentStatus = order.paymentStatus || 'pending';

                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">{orderCode}</td>
                      <td className="px-5 py-4 text-sm text-gray-700">
                        {order.customerInfo 
                          ? `${order.customerInfo.firstName} ${order.customerInfo.lastName}` 
                          : (order.address 
                              ? `${order.address.firstName} ${order.address.lastName}` 
                              : order.customerId || 'N/A')}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-700">{itemCount}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">₹{Number(order.total || 0).toFixed(2)}</td>
                      <td className="px-5 py-4">
                        <select
                          value={orderStatus}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleUpdateStatus(order._id, 'orderStatus', e.target.value)}
                          className={`inline-flex px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${getStatusBadge(orderStatus)}`}
                        >
                          {ORDER_STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{titleize(opt)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={paymentStatus}
                          disabled={updatingId === order._id}
                          onChange={(e) => handleUpdateStatus(order._id, 'paymentStatus', e.target.value)}
                          className={`inline-flex px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer ${getPaymentBadge(paymentStatus)}`}
                        >
                          {PAYMENT_STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{titleize(opt)}</option>
                          ))}
                        </select>
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
      
      <CreateOrderModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={fetchOrders}
      />
    </div>
  );
}
