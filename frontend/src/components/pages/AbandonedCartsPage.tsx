'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { FiShoppingCart, FiClock, FiMail, FiCheckCircle } from 'react-icons/fi';

export default function AbandonedCartsPage() {
  const { adminToken } = useAuth();
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCarts();
  }, [adminToken]);

  const fetchCarts = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/api/admin/abandoned-carts'), {
        headers: getApiHeaders(adminToken || undefined)
      });
      const data = await res.json();
      if (data.success) {
        setCarts(data.data);
      } else {
        setError(data.error || 'Failed to load abandoned carts');
      }
    } catch (err) {
      setError('An error occurred while fetching carts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Abandoned Carts</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {carts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FiShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Abandoned Carts</h3>
          <p className="text-gray-500">Currently, there are no abandoned carts in your store.</p>
        </div>
      ) : (
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cart Total</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carts.map((cart) => (
                  <tr key={cart._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{cart.customer.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <FiMail className="w-3 h-3" /> {cart.customer.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">₹{cart.totalValue.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {cart.items.map((i: any) => i.name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FiClock className="w-4 h-4 text-gray-400" />
                        {new Date(cart.lastUpdatedAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cart.recoveryEmailSent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheckCircle className="w-3 h-3" />
                          Email Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <FiClock className="w-3 h-3" />
                          Waiting
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
