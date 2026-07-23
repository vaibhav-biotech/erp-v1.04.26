'use client';

import React, { useState } from 'react';
import { useAuth, Customer } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

export default function ProfileTab() {
  const { customer, customerToken, refreshCustomer } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    phone: customer?.phone || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?._id || !customerToken) return;

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      const res = await fetch(buildApiUrl(`/api/customers/${customer._id}`), {
        method: 'PUT',
        headers: getApiHeaders(customerToken),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      await refreshCustomer();
      setIsEditing(false);
    } catch (err: any) {
      setMessage({ text: err.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-playfair text-gray-900">
              {`${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'My Profile'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{customer?.email || '-'}</p>
            <p className="text-gray-500 text-sm">{customer?.phone || '-'}</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm w-full sm:w-auto"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {message.text}
        </div>
      )}

      {isEditing ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h3>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    firstName: customer?.firstName || '',
                    lastName: customer?.lastName || '',
                    phone: customer?.phone || '',
                  });
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">First Name</label>
              <p className="text-base text-gray-900">{customer?.firstName || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Last Name</label>
              <p className="text-base text-gray-900">{customer?.lastName || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Email</label>
              <p className="text-base text-gray-900 break-all">{customer?.email || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Phone</label>
              <p className="text-base text-gray-900">{customer?.phone || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Account ID</label>
              <p className="text-sm text-gray-900 font-mono break-all">{customer?._id || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Store</label>
              <p className="text-base text-gray-900">{customer?.store || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
