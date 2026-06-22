'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiCheckCircle, FiClock, FiDollarSign, FiPlus, FiEye, FiEdit2, FiSearch, FiStar } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import AddEditSupplierModal from './AddEditSupplierModal';

export default function SuppliersPage() {
  const { adminToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(buildApiUrl('/api/suppliers/stats'), { headers: getApiHeaders(adminToken || undefined) }),
        fetch(buildApiUrl('/api/suppliers'), { headers: getApiHeaders(adminToken || undefined) })
      ]);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.success) setStats(statsJson.data);
      }
      
      if (listRes.ok) {
        const listJson = await listRes.json();
        if (listJson.success) setSuppliers(listJson.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchData();
    }
  }, [adminToken]);

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchData();
  };

  if (isLoading && !stats) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const KpiCard = ({ title, value, subtitle, icon: Icon }: { title: string, value: string | number, subtitle?: string, icon: any }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="text-gray-400">
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-sm text-gray-500">Manage vendors, ratings, and contact info</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <FiPlus size={18} /> Add Supplier
        </button>
      </div>

      {/* Row 1 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Total Suppliers" value={stats?.totalSuppliers || 0} icon={FiUsers} />
        <KpiCard title="Active Suppliers" value={stats?.activeSuppliers || 0} icon={FiCheckCircle} />
        <KpiCard title="Pending POs" value={stats?.pendingPurchaseOrders || 0} subtitle="Across all suppliers" icon={FiClock} />
        <KpiCard title="Outstanding Payables" value={`₹${stats?.outstandingPayables?.toLocaleString('en-IN') || 0}`} icon={FiDollarSign} />
      </div>

      {/* Row 2 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="This Month Purchases" value={`₹${stats?.thisMonthPurchases?.toLocaleString('en-IN') || 0}`} icon={FiDollarSign} />
        <KpiCard title="Completed Deliveries" value={stats?.completedDeliveries || 0} icon={FiCheckCircle} />
        <KpiCard title="Avg Delivery Time" value={stats?.averageDeliveryTime || '0 days'} icon={FiClock} />
        <KpiCard title="Top Supplier" value={stats?.topSupplier || 'N/A'} icon={FiStar} />
      </div>

      {/* Suppliers Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h2 className="font-semibold text-gray-800 uppercase tracking-wider text-sm">Supplier Directory</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search suppliers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Supplier Info</th>
                <th className="px-6 py-3">Location</th>
                <th className="px-6 py-3">Rating</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Pending PO</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No suppliers found.</td></tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-gray-500 text-xs">{s.companyName || s.contactPerson} • {s.mobile}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {s.address?.city || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-yellow-400">
                        <FiStar className={s.rating > 0 ? "fill-current" : "text-gray-300"} />
                        <span className="ml-1 text-gray-700 font-medium">{s.rating || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {s.pendingPO || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => alert('Supplier Profile view coming soon')}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" 
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                        <button 
                          onClick={() => handleEdit(s)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" 
                          title="Edit"
                        >
                          <FiEdit2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddEditSupplierModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
        supplier={selectedSupplier}
      />
    </motion.div>
  );
}
