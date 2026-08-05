"use client";
import React, { useState, useEffect } from 'react';
import { FiSave, FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function ShippingSettingsPage() {
  const [activeTab, setActiveTab] = useState<'costs' | 'partners'>('costs');
  const [loading, setLoading] = useState(true);

  // Costs State
  const [defaultCost, setDefaultCost] = useState(50);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(60);
  const [storeCosts, setStoreCosts] = useState<any[]>([]);

  // Partners State
  const [partners, setPartners] = useState<any[]>([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [partnerFormData, setPartnerFormData] = useState({
    name: '',
    trackingUrlPrefix: '',
    isActive: true,
    contactInfo: ''
  });

  useEffect(() => {
    fetchSettings();
    fetchPartners();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/shipping/settings');
      const data = await res.json();
      if (data.success && data.data) {
        setDefaultCost(data.data.defaultCost || 50);
        setFreeShippingThreshold(data.data.freeShippingThreshold !== undefined ? data.data.freeShippingThreshold : 60);
        setStoreCosts(data.data.storeCosts || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch('/api/shipping/partners');
      const data = await res.json();
      if (data.success) {
        setPartners(data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleSaveCosts = async () => {
    try {
      const res = await fetch('/api/shipping/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultCost, freeShippingThreshold, storeCosts })
      });
      if (res.ok) alert('Shipping costs saved!');
    } catch (err) {
      console.error(err);
      alert('Failed to save costs');
    }
  };

  const addStoreCostRow = () => {
    setStoreCosts([...storeCosts, { storeName: '', cost: 50, freeShippingThreshold: '' }]);
  };

  const updateStoreCost = (index: number, field: string, value: string | number) => {
    const updated = [...storeCosts];
    updated[index][field] = value;
    setStoreCosts(updated);
  };

  const removeStoreCost = (index: number) => {
    const updated = storeCosts.filter((_, i) => i !== index);
    setStoreCosts(updated);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingPartner ? `/api/shipping/partners/${editingPartner._id}` : '/api/shipping/partners';
      const method = editingPartner ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(partnerFormData)
      });
      const data = await res.json();
      if (data.success) {
        setShowPartnerForm(false);
        setEditingPartner(null);
        setPartnerFormData({ name: '', trackingUrlPrefix: '', isActive: true, contactInfo: '' });
        fetchPartners();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shipping partner?')) return;
    try {
      await fetch(`/api/shipping/partners/${id}`, { method: 'DELETE' });
      fetchPartners();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8">Loading shipping settings...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Shipping Settings</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('costs')}
          className={`py-2 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'costs' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Shipping Costs
        </button>
        <button
          onClick={() => setActiveTab('partners')}
          className={`py-2 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'partners' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Shipping Partners (Couriers)
        </button>
      </div>

      {activeTab === 'costs' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Base Shipping Costs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Shipping Cost (₹)</label>
              <input
                type="number"
                value={defaultCost}
                onChange={(e) => setDefaultCost(Number(e.target.value))}
                className="border-gray-300 rounded-lg p-2 w-full max-w-[200px] shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Applied if a specific store is not listed below.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold (₹)</label>
              <input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="border-gray-300 rounded-lg p-2 w-full max-w-[200px] shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum cart value to get free shipping.</p>
            </div>
          </div>

          <h3 className="text-md font-semibold text-gray-800 mb-3">Store-Specific Costs</h3>
          <div className="space-y-3 mb-6">
            {storeCosts.map((sc, index) => (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <input
                  type="text"
                  placeholder="Store Name (e.g. plantsingarden)"
                  value={sc.storeName}
                  onChange={(e) => updateStoreCost(index, 'storeName', e.target.value)}
                  className="border-gray-300 rounded-lg p-2 flex-1 w-full shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 font-medium">Cost:</span>
                  <input
                    type="number"
                    placeholder="Cost (₹)"
                    value={sc.cost}
                    onChange={(e) => updateStoreCost(index, 'cost', Number(e.target.value))}
                    className="border-gray-300 rounded-lg p-2 w-24 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Free Shipping At:</span>
                  <input
                    type="number"
                    placeholder="(Optional)"
                    value={sc.freeShippingThreshold || ''}
                    onChange={(e) => updateStoreCost(index, 'freeShippingThreshold', e.target.value === '' ? '' : Number(e.target.value))}
                    className="border-gray-300 rounded-lg p-2 w-28 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button onClick={() => removeStoreCost(index)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-2 sm:mt-0">
                  <FiTrash2 size={18} />
                </button>
              </div>
            ))}
            <button onClick={addStoreCostRow} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
              <FiPlus /> Add Store Override
            </button>
          </div>

          <button onClick={handleSaveCosts} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-sm">
            <FiSave /> Save Shipping Costs
          </button>
        </div>
      )}

      {activeTab === 'partners' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Courier Partners</h2>
            {!showPartnerForm && (
              <button 
                onClick={() => setShowPartnerForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm shadow-sm"
              >
                <FiPlus /> Add Courier
              </button>
            )}
          </div>

          {showPartnerForm && (
            <form onSubmit={handleSavePartner} className="bg-gray-50 p-5 rounded-lg border border-gray-200 mb-6">
              <h3 className="font-semibold text-gray-800 mb-4">{editingPartner ? 'Edit Courier' : 'New Courier'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Courier Name *</label>
                  <input
                    type="text"
                    required
                    value={partnerFormData.name}
                    onChange={(e) => setPartnerFormData({...partnerFormData, name: e.target.value})}
                    placeholder="e.g. FedEx, Delhivery"
                    className="w-full border-gray-300 rounded-lg p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tracking URL Prefix (Optional)</label>
                  <input
                    type="text"
                    value={partnerFormData.trackingUrlPrefix}
                    onChange={(e) => setPartnerFormData({...partnerFormData, trackingUrlPrefix: e.target.value})}
                    placeholder="e.g. https://www.fedex.com/fedextrack/?trknbr="
                    className="w-full border-gray-300 rounded-lg p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info (Optional)</label>
                  <input
                    type="text"
                    value={partnerFormData.contactInfo}
                    onChange={(e) => setPartnerFormData({...partnerFormData, contactInfo: e.target.value})}
                    placeholder="Phone or email of account manager"
                    className="w-full border-gray-300 rounded-lg p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={partnerFormData.isActive}
                      onChange={(e) => setPartnerFormData({...partnerFormData, isActive: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active (Show in dropdowns)</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">Save Courier</button>
                <button type="button" onClick={() => { setShowPartnerForm(false); setEditingPartner(null); }} className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courier Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking URL Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {partners.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No couriers added yet.</td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr key={partner._id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{partner.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">{partner.trackingUrlPrefix || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${partner.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {partner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => {
                            setEditingPartner(partner);
                            setPartnerFormData({
                              name: partner.name,
                              trackingUrlPrefix: partner.trackingUrlPrefix || '',
                              isActive: partner.isActive,
                              contactInfo: partner.contactInfo || ''
                            });
                            setShowPartnerForm(true);
                          }} 
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button onClick={() => handleDeletePartner(partner._id)} className="text-red-600 hover:text-red-900">
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
