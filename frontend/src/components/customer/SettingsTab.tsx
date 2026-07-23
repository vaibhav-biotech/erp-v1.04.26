'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { FiCreditCard, FiTrash2, FiSmartphone, FiBriefcase, FiCheck } from 'react-icons/fi';

export default function SettingsTab() {
  const { customer, customerToken, refreshCustomer } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    type: 'upi',
    details: '',
    nameOnAccount: '',
    isDefault: false
  });

  const resetForm = () => {
    setFormData({
      type: 'upi',
      details: '',
      nameOnAccount: '',
      isDefault: false
    });
    setIsAdding(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;
    if (!customer?._id || !customerToken) return;

    try {
      setMessage({ text: '', type: '' });
      const res = await fetch(buildApiUrl(`/api/customers/${customer._id}/payments/${paymentId}`), {
        method: 'DELETE',
        headers: getApiHeaders(customerToken),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove payment method');
      
      setMessage({ text: 'Payment method removed', type: 'success' });
      await refreshCustomer();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?._id || !customerToken) return;

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      const res = await fetch(buildApiUrl(`/api/customers/${customer._id}/payments`), {
        method: 'POST',
        headers: getApiHeaders(customerToken),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save payment method');

      setMessage({ text: 'Payment method saved!', type: 'success' });
      await refreshCustomer();
      resetForm();
    } catch (err: any) {
      setMessage({ text: err.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'upi': return <FiSmartphone className="text-blue-500" size={24} />;
      case 'card': return <FiCreditCard className="text-purple-500" size={24} />;
      case 'bank': return <FiBriefcase className="text-amber-500" size={24} />;
      default: return <FiCreditCard className="text-gray-500" size={24} />;
    }
  };

  const getTypeName = (type: string) => {
    switch(type) {
      case 'upi': return 'UPI ID';
      case 'card': return 'Card Reference';
      case 'bank': return 'Bank Account';
      default: return 'Payment Method';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-playfair text-gray-900">Payment Settings</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your saved payment preferences for faster checkout</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm w-full sm:w-auto"
          >
            + Add Payment Method
          </button>
        )}
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {message.text}
        </div>
      )}

      {isAdding ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment Method</h3>
          <p className="text-sm text-gray-500 mb-6">Note: For your security, do not save full credit card numbers or CVVs. Use UPI IDs or generic references.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black bg-white">
                <option value="upi">UPI ID</option>
                <option value="card">Card (Saved Reference)</option>
                <option value="bank">Bank Account</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Name / Holder Name</label>
              <input type="text" name="nameOnAccount" value={formData.nameOnAccount} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Details ({getTypeName(formData.type)})</label>
              <input type="text" name="details" value={formData.details} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" placeholder={formData.type === 'upi' ? "e.g. john@okicici" : formData.type === 'card' ? "e.g. Visa ending in 4242" : "e.g. A/C 123456789"} />
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" name="isDefault" id="isDefaultPayment" checked={formData.isDefault} onChange={handleChange} className="rounded text-black focus:ring-black" />
              <label htmlFor="isDefaultPayment" className="text-sm text-gray-700">Set as default payment method</label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t mt-6">
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {loading ? 'Saving...' : 'Save Method'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(!customer?.paymentMethods || customer.paymentMethods.length === 0) ? (
            <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <FiCreditCard className="mx-auto text-gray-400 mb-3" size={32} />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Payment Methods</h3>
              <p className="text-gray-500 text-sm mb-4">Save your preferred payment details for a seamless checkout.</p>
              <button onClick={() => setIsAdding(true)} className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium text-sm inline-block">
                Add Method
              </button>
            </div>
          ) : (
            customer.paymentMethods.map((pm: any) => (
              <div key={pm._id} className={`bg-white border rounded-2xl p-5 shadow-sm flex items-start gap-4 relative ${pm.isDefault ? 'border-green-500' : 'border-gray-200'}`}>
                {pm.isDefault && (
                  <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <FiCheck size={12} /> Default
                  </span>
                )}
                
                <div className="p-3 bg-gray-50 rounded-xl">
                  {getIcon(pm.type)}
                </div>
                
                <div className="flex-1 pr-16">
                  <h4 className="font-semibold text-gray-900">{getTypeName(pm.type)}</h4>
                  <p className="text-gray-900 font-mono text-sm mt-1">{pm.details}</p>
                  <p className="text-gray-500 text-xs mt-1">Name: {pm.nameOnAccount}</p>
                  
                  <div className="mt-4 pt-3 border-t border-gray-100 flex gap-4">
                    <button onClick={() => handleDelete(pm._id)} className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1">
                      <FiTrash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
