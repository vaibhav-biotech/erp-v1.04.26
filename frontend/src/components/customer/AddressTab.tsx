'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { FiEdit2, FiTrash2, FiMapPin, FiCheck } from 'react-icons/fi';

export default function AddressTab() {
  const { customer, customerToken, refreshCustomer } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    isDefault: false
  });

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      isDefault: false
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleEdit = (addr: any) => {
    setFormData({
      firstName: addr.firstName || '',
      lastName: addr.lastName || '',
      phone: addr.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || 'India',
      isDefault: addr.isDefault || false
    });
    setEditingId(addr._id);
    setIsAdding(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    if (!customer?._id || !customerToken) return;

    try {
      setMessage({ text: '', type: '' });
      const res = await fetch(buildApiUrl(`/api/customers/${customer._id}/addresses/${addressId}`), {
        method: 'DELETE',
        headers: getApiHeaders(customerToken),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete address');
      
      setMessage({ text: 'Address deleted successfully', type: 'success' });
      await refreshCustomer();
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    }
  };

  const handleSetDefault = async (addressId: string) => {
    if (!customer?._id || !customerToken) return;
    try {
      const res = await fetch(buildApiUrl(`/api/customers/${customer._id}/addresses/${addressId}`), {
        method: 'PUT',
        headers: getApiHeaders(customerToken),
        body: JSON.stringify({ isDefault: true }),
      });
      if (res.ok) {
        await refreshCustomer();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?._id || !customerToken) return;

    try {
      setLoading(true);
      setMessage({ text: '', type: '' });
      
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId 
        ? `/api/customers/${customer._id}/addresses/${editingId}`
        : `/api/customers/${customer._id}/addresses`;

      const res = await fetch(buildApiUrl(url), {
        method,
        headers: getApiHeaders(customerToken),
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save address');

      setMessage({ text: 'Address saved successfully!', type: 'success' });
      await refreshCustomer();
      resetForm();
    } catch (err: any) {
      setMessage({ text: err.message || 'An error occurred', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-playfair text-gray-900">My Addresses</h2>
          <p className="text-gray-600 text-sm mt-1">Manage your delivery addresses</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm w-full sm:w-auto"
          >
            + Add New Address
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{editingId ? 'Edit Address' : 'Add New Address'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input type="text" name="street" value={formData.street} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-black focus:border-black" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" name="isDefault" id="isDefault" checked={formData.isDefault} onChange={handleChange} className="rounded text-black focus:ring-black" />
              <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t mt-6">
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors">
                {loading ? 'Saving...' : 'Save Address'}
              </button>
              <button type="button" onClick={resetForm} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(!customer?.addresses || customer.addresses.length === 0) ? (
            <div className="col-span-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
              <FiMapPin className="mx-auto text-gray-400 mb-3" size={32} />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Addresses Saved</h3>
              <p className="text-gray-500 text-sm mb-4">Add your first address to make checkout faster.</p>
              <button onClick={() => setIsAdding(true)} className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 font-medium text-sm inline-block">
                Add Address
              </button>
            </div>
          ) : (
            customer.addresses.map((addr: any) => (
              <div key={addr._id} className={`bg-white border rounded-2xl p-5 shadow-sm relative ${addr.isDefault ? 'border-green-500' : 'border-gray-200'}`}>
                {addr.isDefault && (
                  <span className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <FiCheck size={12} /> Default
                  </span>
                )}
                <h4 className="font-semibold text-gray-900 text-lg">{addr.firstName} {addr.lastName}</h4>
                <p className="text-gray-600 text-sm mt-1 mb-3">{addr.phone}</p>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>{addr.street}</p>
                  <p>{addr.city}, {addr.state} {addr.zipCode}</p>
                  <p>{addr.country}</p>
                </div>
                <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
                  <button onClick={() => handleEdit(addr)} className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(addr._id)} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1">
                    <FiTrash2 size={14} /> Delete
                  </button>
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr._id)} className="text-gray-600 hover:text-black text-sm font-medium ml-auto">
                      Set as Default
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
