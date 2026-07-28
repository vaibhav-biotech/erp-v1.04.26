'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, fetchWithStore } from '@/lib/storeConfig';

export default function PaymentSettingsPage() {
  const { adminToken } = useAuth();
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    provider: 'razorpay',
    keyId: '',
    keySecret: '',
    isActive: true
  });

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gwRes, setRes] = await Promise.all([
        fetchWithStore(buildApiUrl('/api/settings/gateways'), { token: adminToken || undefined }),
        fetchWithStore(buildApiUrl('/api/settings/global'), { token: adminToken || undefined })
      ]);

      if (gwRes.ok) {
        const data = await gwRes.json();
        setGateways(data.data || []);
      }
      if (setRes.ok) {
        const data = await setRes.json();
        setSettings(data.data || {});
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    
    try {
      const url = editingId 
        ? buildApiUrl(`/api/settings/gateways/${editingId}`)
        : buildApiUrl('/api/settings/gateways');
        
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetchWithStore(url, {
        method,
        token: adminToken || undefined,
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(editingId ? 'Gateway updated successfully' : 'Gateway added successfully');
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment gateway?')) return;
    try {
      const res = await fetchWithStore(buildApiUrl(`/api/settings/gateways/${id}`), {
        method: 'DELETE',
        token: adminToken || undefined
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Gateway deleted');
        fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openModal = (gw?: any) => {
    setError('');
    setSuccessMsg('');
    if (gw) {
      setEditingId(gw._id);
      setFormData({
        name: gw.name,
        provider: gw.provider,
        keyId: gw.keyId,
        keySecret: gw.keySecret,
        isActive: gw.isActive
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        provider: 'razorpay',
        keyId: '',
        keySecret: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Payment Settings...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage payment gateways and global email notifications without modifying code.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
      {successMsg && <div className="p-4 bg-green-50 text-green-600 rounded-lg">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gateways List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800">Configured Gateways</h2>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
            >
              <FiPlus /> Add Gateway
            </button>
          </div>

          {gateways.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-100 text-gray-500">
              No payment gateways configured yet.
            </div>
          ) : (
            <div className="space-y-4">
              {gateways.map(gw => (
                <div key={gw._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-gray-900 text-lg">{gw.name}</h3>
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${gw.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {gw.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 capitalize">Provider: {gw.provider}</p>
                    <p className="text-sm text-gray-400 mt-1 font-mono truncate max-w-sm">Key ID: {gw.keyId}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openModal(gw)}
                      className="p-2 bg-gray-50 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      onClick={() => handleDelete(gw._id)}
                      className="p-2 bg-gray-50 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Settings Panel */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-4">Email Notifications</h2>
            
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div>
                <h4 className="font-medium text-sm text-gray-900">Order Alerts</h4>
                <p className="text-xs text-gray-500">Send emails for new orders/payments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={settings?.emails?.orderAlertsEnabled}
                  onChange={async (e) => {
                    const checked = e.target.checked;
                    await fetchWithStore(buildApiUrl('/api/settings/global'), {
                      method: 'PUT',
                      token: adminToken || undefined,
                      body: JSON.stringify({ emails: { orderAlertsEnabled: checked } })
                    });
                    fetchData();
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">Accountant Emails (Comma separated)</label>
                <textarea 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2" 
                  rows={2}
                  defaultValue={settings?.emails?.accountantEmails?.join(', ')}
                  onBlur={async (e) => {
                    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    await fetchWithStore(buildApiUrl('/api/settings/global'), {
                      method: 'PUT',
                      token: adminToken || undefined,
                      body: JSON.stringify({ emails: { accountantEmails: arr } })
                    });
                  }}
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">Superadmin Emails (Comma separated)</label>
                <textarea 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2" 
                  rows={2}
                  defaultValue={settings?.emails?.superadminEmails?.join(', ')}
                  onBlur={async (e) => {
                    const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    await fetchWithStore(buildApiUrl('/api/settings/global'), {
                      method: 'PUT',
                      token: adminToken || undefined,
                      body: JSON.stringify({ emails: { superadminEmails: arr } })
                    });
                  }}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit Gateway' : 'Add Gateway'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <FiX size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Configuration Name</label>
                <input 
                  required
                  type="text"
                  placeholder="e.g. Primary Razorpay"
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.provider}
                  onChange={e => setFormData({...formData, provider: e.target.value})}
                >
                  <option value="razorpay">Razorpay</option>
                  <option value="phonepe">PhonePe</option>
                  <option value="stripe">Stripe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key ID / Merchant ID</label>
                <input 
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.keyId}
                  onChange={e => setFormData({...formData, keyId: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Secret / Salt</label>
                <input 
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.keySecret}
                  onChange={e => setFormData({...formData, keySecret: e.target.value})}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 font-medium">Gateway is Active</label>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <FiSave /> Save Gateway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
