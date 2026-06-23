'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiSettings, FiUserPlus, FiPauseCircle, FiBarChart2, FiGlobe, FiShoppingBag, FiActivity, FiUsers, FiBox, FiCheckCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl } from '@/lib/storeConfig';

interface Store {
  _id: string;
  name: string;
  storeName: string;
  domain: string;
  status: string;
  ordersCount?: number;
  productsCount?: number;
  customersCount?: number;
  revenue?: number;
  adminName?: string;
  healthScore?: number;
  updatedAt?: string;
  adminAssignedAt?: string;
}

export default function ManageStoresPage() {
  const { adminToken } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', storeName: '', domain: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedAnalyticsStore, setSelectedAnalyticsStore] = useState<Store | null>(null);
  const [selectedManageStore, setSelectedManageStore] = useState<Store | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchStores();
    fetchStaff();
  }, [adminToken]);

  const fetchStaff = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(buildApiUrl('/api/superadmin/staff'), {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const json = await res.json();
      if (json.success) setStaffList(json.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStores = async () => {
    try {
      if (!adminToken) return;
      const res = await fetch(buildApiUrl('/api/superadmin/stores'), {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const json = await res.json();
      if (json.success) {
        setStores(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch stores', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(buildApiUrl('/api/superadmin/stores'), {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}` 
        },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        fetchStores(); // Re-fetch
        setShowAddForm(false);
        setFormData({ name: '', storeName: '', domain: '' });
      } else {
        setError(json.error || 'Failed to create store');
      }
    } catch (err) {
      setError('An error occurred while creating the store');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManageStore || !selectedStaffId) return;
    setAssigning(true);
    try {
      const res = await fetch(buildApiUrl(`/api/superadmin/stores/${selectedManageStore.storeName}/assign-admin`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ staffId: selectedStaffId })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedManageStore(null);
        setSelectedStaffId('');
        fetchStores(); // refresh to show new admin
      } else {
        alert(json.error || 'Failed to assign admin');
      }
    } catch (err) {
      alert('Error assigning admin');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  }

  // Calculate top KPIs
  const totalStores = stores.length;
  const activeStores = stores.filter(s => s.status !== 'suspended').length;
  const totalRevenue = stores.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const totalOrders = stores.reduce((sum, s) => sum + (s.ordersCount || 0), 0);
  const totalCustomers = stores.reduce((sum, s) => sum + (s.customersCount || 0), 0);
  const storesNeedingAttention = stores.filter(s => (s.healthScore || 0) < 80).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span>;
      case 'maintenance':
        return <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Maintenance</span>;
      case 'suspended':
        return <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full"><div className="w-2 h-2 rounded-full bg-red-500"></div> Suspended</span>;
      default:
        return <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full"><div className="w-2 h-2 rounded-full bg-green-500"></div> Active</span>;
    }
  };

  const getHealthBadge = (score: number) => {
    if (score >= 90) return <span className="text-green-600 font-bold flex items-center gap-1"><FiCheckCircle /> Health {score}%</span>;
    if (score >= 70) return <span className="text-yellow-600 font-bold flex items-center gap-1"><FiAlertTriangle /> Health {score}%</span>;
    return <span className="text-red-600 font-bold flex items-center gap-1"><FiXCircle /> Health {score}%</span>;
  };

  const KpiCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="text-gray-400">
        {icon}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      
      {/* Top KPIs Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Stores" value={totalStores} icon={<FiShoppingBag className="w-6 h-6" />} />
        <KpiCard title="Active Stores" value={activeStores} icon={<FiActivity className="w-6 h-6 text-green-500" />} />
        <KpiCard title="Total Revenue" value={`₹${totalRevenue.toLocaleString('en-IN')}`} icon={<FiBarChart2 className="w-6 h-6 text-blue-500" />} />
        <KpiCard title="Total Orders" value={totalOrders.toLocaleString()} icon={<FiBox className="w-6 h-6 text-purple-500" />} />
        <KpiCard title="Total Customers" value={totalCustomers.toLocaleString()} icon={<FiUsers className="w-6 h-6 text-indigo-500" />} />
        <KpiCard title="Attention Needed" value={storesNeedingAttention} icon={<FiAlertTriangle className="w-6 h-6 text-red-500" />} />
      </div>

      {/* Quick Actions Row */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <FiPlus className="w-4 h-4" /> Add Store
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <FiSettings className="w-4 h-4" /> Store Settings
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <FiUserPlus className="w-4 h-4" /> Assign Admin
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors">
            <FiPauseCircle className="w-4 h-4" /> Suspend Store
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium rounded-lg hover:bg-indigo-100 transition-colors">
          <FiBarChart2 className="w-4 h-4" /> View Analytics
        </button>
      </div>

      {showAddForm && (
        <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAddStore} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Store</h2>
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Plants in Garden" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Store Identifier (Slug)</label>
              <input type="text" required value={formData.storeName} onChange={e => setFormData({ ...formData, storeName: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. plantsingarden" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Domain (Optional)</label>
              <input type="text" value={formData.domain} onChange={e => setFormData({ ...formData, domain: e.target.value })} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. plantingarden.com" />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 shadow-sm">
              {submitting ? 'Creating...' : 'Create Store'}
            </button>
          </div>
        </motion.form>
      )}

      {/* Store Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {stores.map(store => (
          <motion.div key={store._id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all flex flex-col">
            
            {/* Card Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center text-xl font-bold text-blue-600">
                  {(store.name || store.storeName || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-playfair text-lg font-bold text-gray-900 leading-tight">{store.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <FiGlobe className="mr-1.5" />
                    <a href={`https://${store.domain || store.storeName + '.com'}`} target="_blank" rel="noreferrer" className="hover:text-blue-600 hover:underline">
                      {store.domain || `${store.storeName}.com`}
                    </a>
                  </div>
                </div>
              </div>
              <div>{getStatusBadge(store.status || 'active')}</div>
            </div>

            {/* Health & Metrics */}
            <div className="p-5 flex-1">
              <div className="flex items-center justify-between mb-5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                {getHealthBadge(store.healthScore || 100)}
                <div className="flex gap-3 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1 text-green-600">Domain ✔</span>
                  <span className="flex items-center gap-1 text-green-600">SSL ✔</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-semibold text-gray-900">₹{(store.revenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Orders</span>
                  <span className="font-semibold text-gray-900">{store.ordersCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Customers</span>
                  <span className="font-semibold text-gray-900">{store.customersCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
                  <span className="text-gray-500">Admin</span>
                  <span className="font-medium text-gray-900">{store.adminName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Last Sync</span>
                  <span className="text-gray-400 font-mono text-xs">{new Date(store.updatedAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button onClick={() => setSelectedManageStore(store)} className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 font-medium text-sm rounded-lg hover:bg-gray-50 transition-colors text-center shadow-sm">
                Manage
              </button>
              <button onClick={() => setSelectedAnalyticsStore(store)} className="flex-1 py-2 bg-blue-50 border border-blue-200 text-blue-700 font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors text-center shadow-sm">
                Analytics
              </button>
            </div>
          </motion.div>
        ))}
        {stores.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
            No stores created yet. Add your first store to get started!
          </div>
        )}
      </div>

      {/* Manage / Assign Admin Modal */}
      {selectedManageStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Manage Store</h2>
              <button onClick={() => setSelectedManageStore(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <FiXCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignAdmin} className="p-6">
              {selectedManageStore.adminName && selectedManageStore.adminName !== 'Unassigned' && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2"><FiUsers /> Current Assignment</h3>
                  <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-blue-700">Assigned Admin</span>
                    <span className="font-bold text-blue-900">{selectedManageStore.adminName}</span>
                  </div>
                  {selectedManageStore.adminAssignedAt && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">Assigned On</span>
                      <span className="font-medium text-blue-900">{new Date(selectedManageStore.adminAssignedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Store Admin</label>
                <p className="text-xs text-gray-500 mb-4">Select an existing staff member to assign as the Store Admin for <strong>{selectedManageStore.name}</strong>. Their role will be automatically upgraded.</p>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">-- Select Staff Member --</option>
                  {staffList.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name} ({staff.username}) {staff.storeName ? ` - Currently at ${staff.storeName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setSelectedManageStore(null)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={assigning || !selectedStaffId} className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {assigning ? 'Assigning...' : 'Assign Admin'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Analytics Modal */}
      {selectedAnalyticsStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center text-2xl font-bold text-blue-600">
                  {(selectedAnalyticsStore.name || selectedAnalyticsStore.storeName || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAnalyticsStore.name || selectedAnalyticsStore.storeName} Analytics</h2>
                  <p className="text-sm text-gray-500">Performance overview and KPIs</p>
                </div>
              </div>
              <button onClick={() => setSelectedAnalyticsStore(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors">
                <FiXCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-blue-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{(selectedAnalyticsStore.revenue || 0).toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-purple-600 mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedAnalyticsStore.ordersCount || 0}</p>
                </div>
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <p className="text-sm font-semibold text-green-600 mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{selectedAnalyticsStore.ordersCount ? Math.round((selectedAnalyticsStore.revenue || 0) / selectedAnalyticsStore.ordersCount).toLocaleString('en-IN') : 0}
                  </p>
                </div>
              </div>

              {/* Progress Bars / Deep Analytics */}
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-100 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FiActivity /> Health Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Overall Score</span>
                        <span className="font-bold text-gray-900">{selectedAnalyticsStore.healthScore || 100}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${(selectedAnalyticsStore.healthScore || 100) > 80 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${selectedAnalyticsStore.healthScore || 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Customer Conversion</span>
                        <span className="font-bold text-gray-900">
                          {selectedAnalyticsStore.customersCount ? Math.min(100, Math.round((selectedAnalyticsStore.ordersCount || 0) / selectedAnalyticsStore.customersCount * 100)) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${selectedAnalyticsStore.customersCount ? Math.min(100, Math.round((selectedAnalyticsStore.ordersCount || 0) / selectedAnalyticsStore.customersCount * 100)) : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><FiUsers /> Audience</h3>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                    <span className="text-gray-600 text-sm">Total Customers</span>
                    <span className="font-bold text-gray-900">{selectedAnalyticsStore.customersCount || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Store Admin</span>
                    <span className="font-semibold text-gray-900 text-sm">{selectedAnalyticsStore.adminName || 'Unassigned'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedAnalyticsStore(null)} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
