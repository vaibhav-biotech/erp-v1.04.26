'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiPackage, FiTruck, FiCreditCard, FiUser, FiMapPin, FiClock } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { adminToken } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminToken) return;
    
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(buildApiUrl(`/api/superadmin/orders/${id}`), {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        const json = await response.json();
        if (json.success) {
          setOrder(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch order details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, adminToken]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'processing': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'packed': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'shipped': return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'out_for_delivery': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      case 'returned': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading Order Details...</div>;
  }

  if (!order) {
    return <div className="p-12 text-center text-red-500">Order not found</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/superadmin?page=all-orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <FiArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="font-playfair text-3xl text-gray-900 flex items-center gap-3">
              {order.orderNumber}
              <span className="text-sm font-montserrat font-bold bg-gray-100 px-3 py-1 rounded-full uppercase text-gray-600 border border-gray-200">
                Store: {order.storeName}
              </span>
            </h1>
            <p className="font-montserrat text-sm text-gray-500 flex items-center gap-2 mt-1">
              <FiClock className="w-4 h-4" />
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${getStatusBadge(order.orderStatus)}`}>
            Order: {order.orderStatus?.replace('_', ' ').toUpperCase()}
          </span>
          <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${
            order.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            Payment: {order.paymentStatus?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Items & Totals */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <FiPackage className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <FiCreditCard className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900">Payment Summary</h2>
            </div>
            <div className="p-6 bg-gray-50/50">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">{formatCurrency(order.shipping)}</span>
                </div>
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Customer Info & Timeline */}
        <div className="space-y-8">
          
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <FiUser className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-gray-900">Customer Details</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
                <p className="font-medium text-gray-900">{order.address?.firstName} {order.address?.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Contact</p>
                <p className="font-medium text-gray-900">{order.address?.email}</p>
                <p className="font-medium text-gray-900">{order.address?.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                  <FiMapPin className="w-3 h-3" /> Shipping Address
                </p>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {order.address?.address}<br/>
                  {order.address?.apartment && <>{order.address?.apartment}<br/></>}
                  {order.address?.city}, {order.address?.state} {order.address?.pincode}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline / History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-2">
              <FiTruck className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-bold text-gray-900">Status History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {order.statusHistory?.map((hist: any, idx: number) => (
                  <div key={idx} className="relative pl-6 border-l-2 border-gray-100 last:border-0 pb-6 last:pb-0">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                    <p className="font-bold text-gray-900 text-sm mb-1">{hist.status?.replace('_', ' ').toUpperCase()}</p>
                    <p className="text-xs text-gray-500">{new Date(hist.createdAt).toLocaleString()}</p>
                    {hist.note && <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded-lg">{hist.note}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
