"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiEye, FiDownload, FiTruck } from 'react-icons/fi';
import ShippingDetailsModal from '@/components/ShippingDetailsModal';

export default function AccountsShippingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingTargetOrderId, setShippingTargetOrderId] = useState<string | null>(null);

  const [filterStore, setFilterStore] = useState('all');
  const [filterOrderStatus, setFilterOrderStatus] = useState('processing');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];

  const storeNames = Array.from(new Set(orders.map((o: any) => o.storeName || o.store?.name || 'Unknown Store')));

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStore, filterOrderStatus]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/accounts/orders');
      const data = await res.json();
      if(data.success) {
        setOrders(data.data);
      }
    } catch(err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, field: string, value: string, additionalData?: any) => {
    if (field === 'orderStatus' && value === 'shipped' && !additionalData) {
      setShippingTargetOrderId(orderId);
      setIsShippingModalOpen(true);
      return;
    }

    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/accounts/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value, ...additionalData })
      });
      if(res.ok) {
        setOrders(orders.map((o: any) => o._id === orderId ? { ...o, [field]: value } : o) as any);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o: any) => {
    const sName = o.storeName || o.store?.name || 'Unknown Store';
    if (filterStore !== 'all' && sName !== filterStore) return false;
    if (filterOrderStatus !== 'all' && (o.orderStatus || 'pending') !== filterOrderStatus) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const exportToCSV = () => {
    if (filteredOrders.length === 0) return alert('No data to export');
    const headers = ['Order Number', 'Date', 'Store', 'Customer Name', 'Shipping Address', 'Order Status', 'Courier', 'Tracking No'];
    const csvRows = [headers.join(',')];

    for (const order of filteredOrders) {
      const address = order.shippingAddress || order.address || {};
      const addressStr = `${address.address || address.street || ''} ${address.city || ''} ${address.state || ''} ${address.postalCode || address.zipCode || ''}`;
      
      const row = [
        order.orderNumber || '',
        new Date(order.createdAt).toLocaleDateString(),
        order.storeName || order.store?.name || 'N/A',
        order.customer?.name || order.shippingDetail?.name || 'N/A',
        addressStr,
        order.orderStatus || 'pending',
        order.tracking?.courierName || 'N/A',
        order.tracking?.trackingNumber || 'N/A'
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      csvRows.push(row.join(','));
    }

    const csvData = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const csvUrl = URL.createObjectURL(csvData);
    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = `Shipping_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FiTruck /> Shipping Management
          </h1>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition shadow-sm"
          >
            <FiDownload />
            Export CSV
          </button>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select 
            value={filterStore} onChange={(e) => setFilterStore(e.target.value)}
            className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400"
          >
            <option value="all">All Stores</option>
            {storeNames.map((name: any) => <option key={name} value={name}>{name}</option>)}
          </select>
          <select 
            value={filterOrderStatus} onChange={(e) => setFilterOrderStatus(e.target.value)}
            className="text-sm border-gray-300 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-0 focus:border-gray-400"
          >
            <option value="all">All Order Statuses</option>
            {ORDER_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading shipping orders...</div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tracking</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((ord: any) => (
                  <tr key={ord._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">#{ord.orderId || ord._id.substring(0, 8)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(ord.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ord.storeName || ord.store?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ord.customerInfo ? `${ord.customerInfo.firstName} ${ord.customerInfo.lastName}` : (ord.address ? `${ord.address.firstName} ${ord.address.lastName}` : 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ord.tracking?.courierName ? (
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700">{ord.tracking.courierName}</span>
                          <span className="text-xs">{ord.tracking.trackingNumber}</span>
                          {ord.tracking.trackingUrl && (
                             <a href={ord.tracking.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs hover:underline mt-1">Track</a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Unshipped</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <select 
                        value={ord.orderStatus || 'pending'}
                        disabled={updatingId === ord._id}
                        onChange={(e) => handleUpdateStatus(ord._id, 'orderStatus', e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer ${
                          ord.orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                          ord.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          ord.orderStatus === 'processing' ? 'bg-indigo-100 text-indigo-800' :
                          ord.orderStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {ORDER_STATUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1).replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/accounts/orders/${ord._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        <FiEye size={13} />
                        View/Ship
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {filteredOrders.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border-gray-300 rounded-md text-sm py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredOrders.length)} of {filteredOrders.length}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <ShippingDetailsModal
          isOpen={isShippingModalOpen}
          onClose={() => setIsShippingModalOpen(false)}
          onSubmit={(data) => {
            if (shippingTargetOrderId) {
              handleUpdateStatus(shippingTargetOrderId, 'orderStatus', 'shipped', data);
            }
            setIsShippingModalOpen(false);
          }}
        />
    </div>
  );
}
