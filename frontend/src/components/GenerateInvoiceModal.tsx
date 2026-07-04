'use client';

import React, { useState } from 'react';
import { FiX, FiFileText, FiCalendar, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, fetchWithStore } from '@/lib/storeConfig';

interface GenerateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: any) => void;
  order: any;
  isAccountantMode?: boolean;
}

export default function GenerateInvoiceModal({ isOpen, onClose, onSuccess, order, isAccountantMode = false }: GenerateInvoiceModalProps) {
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { adminToken } = useAuth();

  if (!isOpen || !order) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = isAccountantMode 
        ? `/api/accounts/orders/${order._id}/invoice`
        : `/api/orders/${order._id}/invoice`;

      const res = await fetchWithStore(buildApiUrl(endpoint), {
        method: 'POST',
        token: adminToken || undefined,
        body: JSON.stringify({ invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : undefined })
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.order);
        onClose();
      } else {
        throw new Error(data.message || 'Failed to generate invoice');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => (order.items || []).reduce((sum: number, item: any) => sum + (Number(item.price) * Number(item.quantity)), 0);
  const subtotal = calculateSubtotal();
  const tax = Math.round(subtotal * 0.18 * 100) / 100; // approximate display tax
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <FiFileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Generate Invoice Preview</h2>
              <p className="text-sm text-gray-500">Order #{order.orderNumber || order._id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
          
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            {/* Date Override Setting */}
            <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div>
                <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <FiCalendar /> Invoice Generation Date
                </h4>
                <p className="text-xs text-blue-700 mt-1">This will be printed on the invoice. Adjust for backdating.</p>
              </div>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="px-4 py-2 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Invoice Preview */}
            <div className="border border-gray-200 p-8 rounded-lg relative overflow-hidden bg-white">
              
              <div className="flex justify-between items-start mb-10 border-b border-gray-100 pb-8">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">INVOICE</h1>
                  <p className="text-gray-500 mt-1">PREVIEW MODE</p>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{order.storeName?.toUpperCase() || 'PLANTS IN GARDEN'}</h3>
                  <p>123 Greenery Lane, Flora City</p>
                  <p>GSTIN: 27AABCU9603R1ZX</p>
                  <p>Date: {invoiceDate}</p>
                </div>
              </div>

              <div className="flex justify-between mb-8 text-sm">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h4>
                  <p className="font-bold text-gray-900 text-base">
                    {order.customerInfo?.firstName} {order.customerInfo?.lastName}
                  </p>
                  <p className="text-gray-600 mt-1">{order.customerInfo?.email}</p>
                  <p className="text-gray-600">{order.customerInfo?.phone}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Order Info</h4>
                  <p className="text-gray-600"><strong>ID:</strong> {order.orderNumber || order._id}</p>
                  <p className="text-gray-600 mt-1"><strong>Payment:</strong> {String(order.paymentStatus).toUpperCase()}</p>
                </div>
              </div>

              <table className="w-full text-sm mb-8">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Qty</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Price</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {order.items?.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 text-gray-900">{item.name}</td>
                      <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right text-gray-600">₹{Number(item.price).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">₹{(item.quantity * item.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 space-y-3 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {order.customDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{Number(order.customDiscount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (18% est.)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 border-b border-gray-100 pb-3">
                    <span>Shipping</span>
                    <span>{order.shippingCost ? `₹${order.shippingCost}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                    <span>Total Amount</span>
                    <span>₹{Number(order.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-lg flex items-center gap-2 transition shadow-sm"
          >
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span> : <FiCheckCircle />}
            {loading ? 'Generating...' : 'Confirm & Generate Invoice'}
          </button>
        </div>

      </div>
    </div>
  );
}
