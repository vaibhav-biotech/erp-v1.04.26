'use client';

import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiSearch } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, fetchWithStore } from '@/lib/storeConfig';

export default function AccountsPaymentsPage() {
  const { adminToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterStore, setFilterStore] = useState('all');
  const [filterMethod, setFilterMethod] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [adminToken]);

  const fetchOrders = async () => {
    try {
      // Reusing the existing accounts/orders route to fetch all orders
      const res = await fetchWithStore(buildApiUrl('/api/accounts/orders'), {
        token: adminToken || undefined
      });
      const data = await res.json();
      if(data.success) {
        setOrders(data.data || []);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  // All payments (Online and Offline)
  const validPayments = orders.filter(o => o.paymentMethod || o.razorpayOrderId);
  
  const storeNames = Array.from(new Set(validPayments.map(o => o.storeName || o.store?.name || 'Unknown Store')));

  const filteredPayments = validPayments.filter(o => {
    const sName = o.storeName || o.store?.name || 'Unknown Store';
    if (filterStore !== 'all' && sName !== filterStore) return false;
    
    if (filterMethod !== 'all') {
      const isOnline = o.paymentMethod === 'online' || o.razorpayOrderId;
      if (filterMethod === 'online' && !isOnline) return false;
      if (filterMethod === 'offline' && isOnline) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchId = o._id.toLowerCase().includes(term);
      const matchRz = o.razorpayPaymentId?.toLowerCase().includes(term);
      const matchCust = o.customerInfo?.name?.toLowerCase().includes(term);
      if (!matchId && !matchRz && !matchCust) return false;
    }
    return true;
  });

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Payments...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-sm text-gray-500">Track and verify all online and offline transactions.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center w-full md:w-auto">
          <select
            className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
          >
            <option value="all">All Stores</option>
            {storeNames.map((name: any) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          <select
            className="border border-gray-300 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
          >
            <option value="all">All Methods</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>
          
          <div className="relative flex-1 md:w-64">
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text"
              placeholder="Search ID, Customer..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-500 font-medium">
          Total Transactions: {filteredPayments.length}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Store</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No payments found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map(payment => (
                  <tr key={payment._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-gray-900 mb-1">Ord: {payment._id}</div>
                      {payment.paymentMethod === 'online' || payment.razorpayOrderId ? (
                        payment.razorpayPaymentId ? (
                          <div className="font-mono text-xs text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded">
                            Pay: {payment.razorpayPaymentId}
                          </div>
                        ) : (
                          <div className="text-xs text-orange-500">Pending Gateway Init</div>
                        )
                      ) : (
                        <div className="font-mono text-xs text-gray-600 bg-gray-100 inline-block px-2 py-0.5 rounded">
                          Method: {payment.paymentMethod || 'Offline'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{payment.customerInfo?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{payment.customerInfo?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {payment.storeName || payment.store?.name}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      ₹{payment.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {payment.paymentStatus === 'Paid' ? (
                        <span className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
                          <FiCheckCircle /> Verified
                        </span>
                      ) : payment.paymentStatus === 'Refunded' ? (
                        <span className="flex items-center gap-1.5 text-red-700 bg-red-50 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
                          <FiXCircle /> Refunded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-2.5 py-1 rounded-full text-xs font-bold w-fit">
                          <FiClock /> Unpaid
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(payment.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
