"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiEye } from 'react-icons/fi';

export default function AccountsOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filterStore, setFilterStore] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterOrderStatus, setFilterOrderStatus] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');

  const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
  const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'failed', 'refunded', 'cod_pending'];

  const storeNames = Array.from(new Set(orders.map((o: any) => o.storeName || o.store?.name || 'Unknown Store')));

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/accounts/orders');
      const data = await res.json();
      if(data.success) {
        setOrders(data.data);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, field: 'orderStatus' | 'paymentStatus', value: string) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/accounts/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      if(res.ok) {
        setOrders(orders.map((o: any) => o._id === orderId ? { ...o, [field]: value } : o) as any);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    const sName = o.storeName || o.store?.name || 'Unknown Store';
    if (filterStore !== 'all' && sName !== filterStore) return false;
    if (filterOrderStatus !== 'all' && (o.orderStatus || 'pending') !== filterOrderStatus) return false;
    if (filterPaymentStatus !== 'all' && (o.paymentStatus || 'pending') !== filterPaymentStatus) return false;
    
    if (filterStartDate || filterEndDate) {
      const orderDate = new Date(o.createdAt);
      // Reset time to start of day for comparison
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

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Store Orders</h1>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={filterStore} onChange={(e) => setFilterStore(e.target.value)}
            className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400"
          >
            <option value="all">All Stores</option>
            {storeNames.map((name: any) => <option key={name} value={name}>{name}</option>)}
          </select>
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
            {ORDER_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>)}
          </select>
          <select 
            value={filterPaymentStatus} onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400"
          >
            <option value="all">All Payment Statuses</option>
            {PAYMENT_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((ord: any) => (
                  <tr key={ord._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">#{ord.orderId || ord._id.substring(0, 8)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ord.storeName || ord.store?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ord.customerInfo ? `${ord.customerInfo.firstName} ${ord.customerInfo.lastName}` : (ord.address ? `${ord.address.firstName} ${ord.address.lastName}` : 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">₹{(ord.totalAmount || ord.total || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select 
                        value={ord.orderStatus || 'pending'}
                        disabled={updatingId === ord._id}
                        onChange={(e) => handleUpdateStatus(ord._id, 'orderStatus', e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${
                          ord.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          ord.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          ord.orderStatus === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                          ord.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ORDER_STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select 
                        value={ord.paymentStatus || 'pending'}
                        disabled={updatingId === ord._id}
                        onChange={(e) => handleUpdateStatus(ord._id, 'paymentStatus', e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${
                          ord.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {PAYMENT_STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/accounts/orders/${ord._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <FiEye size={13} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </div>
  );
}
