'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiClock, FiDollarSign, FiPlus, FiEye, FiEdit2, FiSearch, FiCheckCircle, FiTruck } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import PurchaseOrderForm from '@/components/forms/PurchaseOrderForm';
import PurchaseOrderDetails from '@/components/pages/PurchaseOrderDetails';

export default function PurchaseOrdersPage() {
  const { adminToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  
  // Navigation State
  const [viewingPoId, setViewingPoId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, listRes] = await Promise.all([
        fetch(buildApiUrl('/api/purchase-orders/stats'), { headers: getApiHeaders(adminToken || undefined) }),
        fetch(buildApiUrl('/api/purchase-orders'), { headers: getApiHeaders(adminToken || undefined) })
      ]);

      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        if (statsJson.success) setStats(statsJson.data);
      }
      
      if (listRes.ok) {
        const listJson = await listRes.json();
        if (listJson.success) setPurchaseOrders(listJson.data);
      }
    } catch (error) {
      console.error('Error fetching PO data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchData();
    }
  }, [adminToken]);

  const handleAddNew = () => {
    setSelectedPO(null);
    setIsModalOpen(true);
  };

  const handleEdit = (po: any) => {
    setSelectedPO(po);
    setIsModalOpen(true);
  };

  const handleView = (po: any) => {
    setViewingPoId(po._id);
  };

  const handleBackFromView = () => {
    setViewingPoId(null);
    fetchData(); // Refresh list to get updated statuses/stats after GRN
  };

  const handleSaveSuccess = () => {
    fetchData();
  };

  if (isLoading && !stats) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  }

  if (viewingPoId) {
    return <PurchaseOrderDetails poId={viewingPoId} onBack={handleBackFromView} />;
  }

  const filteredPOs = purchaseOrders.filter(po =>  
    po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) || 
    po.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Accepted': return 'bg-indigo-100 text-indigo-800';
      case 'Partially Received': return 'bg-yellow-100 text-yellow-800';
      case 'Received': return 'bg-green-100 text-green-800';
      case 'Completed': return 'bg-emerald-100 text-emerald-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500">Manage purchasing, GRNs, and centralized inventory.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          <FiPlus size={18} /> Create PO
        </button>
      </div>

      {/* Row 1 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Total POs" value={stats?.totalPO || 0} icon={FiShoppingCart} />
        <KpiCard title="Pending POs" value={stats?.pendingPO || 0} icon={FiClock} />
        <KpiCard title="Completed POs" value={stats?.completedPO || 0} icon={FiCheckCircle} />
        <KpiCard title="Cancelled POs" value={stats?.cancelledPO || 0} icon={FiShoppingCart} />
      </div>

      {/* Row 2 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard title="Purchase Value" value={`₹${stats?.purchaseValue?.toLocaleString('en-IN') || 0}`} icon={FiDollarSign} />
        <KpiCard title="Pending Deliveries" value={stats?.pendingDeliveries || 0} icon={FiTruck} />
        <KpiCard title="Today's Deliveries" value={stats?.todaysDeliveries || 0} icon={FiTruck} />
        <KpiCard title="Supplier Payments" value={`₹${stats?.supplierPayments?.toLocaleString('en-IN') || 0}`} icon={FiDollarSign} />
      </div>

      {/* PO Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
          <h2 className="font-semibold text-gray-800 uppercase tracking-wider text-sm">All Purchase Orders</h2>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search PO Number or Supplier..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">PO Number</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Expected Date</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No Purchase Orders found.</td></tr>
              ) : (
                filteredPOs.map((po) => (
                  <tr key={po._id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-blue-600">
                      {po.poNumber}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{po.supplier?.name || 'Unknown Supplier'}</div>
                      <div className="text-gray-500 text-xs">{po.supplier?.companyName || ''}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ₹{po.financials?.grandTotal?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {po.expectedDate ? new Date(po.expectedDate).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleView(po)}
                          className="px-3 py-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition font-medium" 
                        >
                          Receive / View
                        </button>
                        <button 
                          onClick={() => handleEdit(po)}
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

      <PurchaseOrderForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSuccess}
        poToEdit={selectedPO}
      />
    </motion.div>
  );
}
