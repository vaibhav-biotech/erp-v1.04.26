'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import Link from 'next/link';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

export default function OrderDetailPage() {
  const { customer, customerToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!customer || !customerToken) {
      router.push('/auth/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        const headers = getApiHeaders(customerToken || '');
        const res = await fetch(
          buildApiUrl(`/api/orders/${orderId}`),
          { headers }
        );

        if (!res.ok) throw new Error('Failed to fetch order');
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || 'Error loading order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, customer, customerToken, router]);

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

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar />
      
      <div className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Link */}
          <Link href="/customer/orders" className="text-black font-montserrat hover:underline mb-6 inline-block">
            ← Back to Orders
          </Link>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              </div>
              <p className="text-gray-600 mt-4">Loading order details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : order ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Order Header */}
              <div className="mb-8">
                <h1 className="font-playfair text-3xl font-bold text-black mb-4">
                  Order {order.orderNumber}
                </h1>
                <div className="flex flex-wrap gap-4">
                  <span className={`px-4 py-2 rounded font-montserrat font-semibold text-sm ${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                  </span>
                  <span className="px-4 py-2 rounded bg-gray-100 text-gray-800 font-montserrat font-semibold text-sm">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Items - Main Column */}
                <div className="lg:col-span-2">
                  {/* Items */}
                  <div className="border border-gray-300 rounded-lg p-6 mb-6">
                    <h2 className="font-montserrat font-bold text-lg text-black mb-6">
                      Order Items
                    </h2>
                    <div className="space-y-4">
                      {order.items.map((item: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-montserrat font-bold text-black">
                              {item.name}
                            </p>
                            {item.size && (
                              <p className="text-gray-600 text-sm">
                                Size: {item.size}
                              </p>
                            )}
                            <p className="text-gray-600 text-sm">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-montserrat font-bold text-black">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </p>
                            <p className="text-gray-600 text-sm">
                              ₹{item.price.toLocaleString('en-IN')} each
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="border border-gray-300 rounded-lg p-6">
                    <h2 className="font-montserrat font-bold text-lg text-black mb-4">
                      Shipping Address
                    </h2>
                    <div className="text-gray-700 font-montserrat">
                      <p className="font-bold text-black">{`${customer.firstName || ''} ${customer.lastName || ''}`.trim()}</p>
                      <p>{order.address.street}</p>
                      <p>
                        {order.address.city}, {order.address.state}{' '}
                        {order.address.pincode}
                      </p>
                      {order.address.phone && (
                        <p className="mt-2 text-black font-montserrat">
                          {order.address.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Summary - Sidebar */}
                <div>
                  <div className="border border-gray-300 rounded-lg p-6 sticky top-24">
                    <h2 className="font-montserrat font-bold text-lg text-black mb-6">
                      Order Summary
                    </h2>
                    
                    <div className="space-y-3 text-sm font-montserrat mb-6 pb-6 border-b border-gray-300">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="text-black font-bold">
                          ₹{order.subtotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (18%)</span>
                        <span className="text-black font-bold">
                          ₹{order.tax.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="text-black font-bold">
                          {order.shipping === 0 ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            `₹${order.shipping}`
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between font-montserrat font-bold text-lg mb-6">
                      <span className="text-black">Total</span>
                      <span className="text-black">
                        ₹{order.total.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Payment & Status Info */}
                    <div className="space-y-3 text-sm font-montserrat">
                      <div>
                        <p className="text-gray-600 mb-1">Payment Method</p>
                        <p className="text-black font-bold">
                          {order.paymentMethod === 'cod'
                            ? 'Cash on Delivery'
                            : order.paymentMethod}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 mb-1">Payment Status</p>
                        <p
                          className={`font-bold ${
                            order.paymentStatus === 'completed'
                              ? 'text-green-600'
                              : 'text-yellow-600'
                          }`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() +
                            order.paymentStatus.slice(1)}
                        </p>
                      </div>
                      {order.notes && (
                        <div>
                          <p className="text-gray-600 mb-1">Notes</p>
                          <p className="text-black">{order.notes}</p>
                        </div>
                      )}
                    </div>

                    <Link
                      href="/customer/orders"
                      className="w-full block text-center bg-black text-white py-3 rounded-lg font-montserrat font-bold text-sm hover:bg-gray-900 transition mt-6"
                    >
                      Back to Orders
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
