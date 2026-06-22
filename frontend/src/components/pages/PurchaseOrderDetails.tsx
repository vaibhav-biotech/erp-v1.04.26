'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheckCircle, FiClock, FiFileText, FiDollarSign, FiPackage, FiTruck, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface PurchaseOrderDetailsProps {
  poId: string;
  onBack: () => void;
}

export default function PurchaseOrderDetails({ poId, onBack }: PurchaseOrderDetailsProps) {
  const { adminToken } = useAuth();
  const [po, setPo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReceiving, setIsReceiving] = useState(false);
  
  // GRN State
  const [receiveData, setReceiveData] = useState<{ [productId: string]: { rec: number, dmg: number } }>({});
  const [grnNotes, setGrnNotes] = useState('');

  const fetchPO = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/api/purchase-orders/${poId}`), {
        headers: getApiHeaders(adminToken || undefined)
      });
      if (response.ok) {
        const json = await response.json();
        setPo(json.data);
      }
    } catch (e) {
      console.error('Error fetching PO', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (poId && adminToken) {
      fetchPO();
    }
  }, [poId, adminToken]);

  const handleReceiveQtyChange = (productId: string, field: 'rec' | 'dmg', value: string) => {
    setReceiveData(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: Number(value) || 0
      }
    }));
  };

  const handleProcessGRN = async () => {
    if (Object.keys(receiveData).length === 0) {
      return alert('Enter quantities to receive first.');
    }

    const items = Object.entries(receiveData).map(([productId, qtys]) => ({
      productId,
      receivedQty: qtys.rec || 0,
      damagedQty: qtys.dmg || 0
    })).filter(i => i.receivedQty > 0 || i.damagedQty > 0);

    if (items.length === 0) {
      return alert('Enter at least one received quantity greater than 0.');
    }

    setIsReceiving(true);
    try {
      const response = await fetch(buildApiUrl(`/api/purchase-orders/${poId}/receive`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getApiHeaders(adminToken || undefined) },
        body: JSON.stringify({ items, notes: grnNotes })
      });
      
      if (response.ok) {
        alert('Goods Received Successfully! Central Inventory Updated.');
        setReceiveData({});
        setGrnNotes('');
        fetchPO();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (e) {
      console.error('GRN Error', e);
      alert('Error processing GRN.');
    } finally {
      setIsReceiving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>;
  }

  if (!po) {
    return (
      <div className="text-center py-12">
        <FiAlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Purchase Order not found</h3>
        <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">Go Back</button>
      </div>
    );
  }

  const isCompleted = po.status === 'Completed' || po.status === 'Cancelled';
  const totalPending = po.products.reduce((sum: number, p: any) => sum + (p.pendingQty || 0), 0);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white rounded-lg shadow-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition">
          <FiArrowLeft size={20} />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{po.poNumber}</h1>
            <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>{po.status}</span>
          </div>
          <p className="text-sm text-gray-500">Supplier: <span className="font-medium text-gray-800">{po.supplier?.name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Products / GRN Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2"><FiPackage /> Ordered Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-4 py-3 text-center">Ordered</th>
                    <th className="px-4 py-3 text-center text-green-600">Received</th>
                    <th className="px-4 py-3 text-center text-red-500">Damaged</th>
                    <th className="px-4 py-3 text-center text-orange-500">Pending</th>
                    {!isCompleted && <th className="px-6 py-3 bg-blue-50 text-blue-700">Receive Now</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {po.products.map((p: any) => (
                    <tr key={p._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {p.product?.name || 'Unknown Product'}
                        <div className="text-xs text-gray-500">SKU: {p.product?.sku || '-'}</div>
                      </td>
                      <td className="px-4 py-4 text-center font-semibold text-gray-700">{p.orderedQty}</td>
                      <td className="px-4 py-4 text-center text-green-600 font-medium">{p.receivedQty}</td>
                      <td className="px-4 py-4 text-center text-red-500">{p.damagedQty}</td>
                      <td className="px-4 py-4 text-center text-orange-500 font-medium">{p.pendingQty}</td>
                      {!isCompleted && (
                        <td className="px-4 py-3 bg-blue-50/50">
                          {p.pendingQty > 0 ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                max={p.pendingQty}
                                placeholder="Rec"
                                value={receiveData[p.product?._id]?.rec || ''}
                                onChange={e => handleReceiveQtyChange(p.product?._id, 'rec', e.target.value)}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 text-center"
                              />
                              <input 
                                type="number" 
                                min="0" 
                                placeholder="Dmg"
                                value={receiveData[p.product?._id]?.dmg || ''}
                                onChange={e => handleReceiveQtyChange(p.product?._id, 'dmg', e.target.value)}
                                className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 text-center text-red-500"
                              />
                            </div>
                          ) : (
                            <span className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-center"><FiCheckCircle /> Fully Received</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GRN Action Footer */}
            {!isCompleted && totalPending > 0 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-end gap-4 justify-between">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">GRN Notes / Delivery Person Info</label>
                  <input 
                    type="text" 
                    value={grnNotes}
                    onChange={e => setGrnNotes(e.target.value)}
                    placeholder="E.g. Delivered by FedEx, 2 boxes damaged" 
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-blue-500"
                  />
                </div>
                <button 
                  onClick={handleProcessGRN}
                  disabled={isReceiving}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <FiTruck /> {isReceiving ? 'Processing...' : 'Process GRN & Update Inventory'}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Info Cards */}
        <div className="space-y-6">
          
          {/* Financials */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiDollarSign /> Financial Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{po.financials?.subtotal?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST Amount</span>
                <span>₹{po.financials?.gstAmount?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Transport Fee</span>
                <span>₹{po.financials?.transportFee?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-gray-900 text-lg">
                <span>Grand Total</span>
                <span>₹{po.financials?.grandTotal?.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Payment Status</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded ${po.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{po.paymentStatus}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Amount Paid</span>
                <span className="font-medium text-gray-900">₹{po.financials?.amountPaid?.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><FiFileText /> Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Expected Date</p>
                <p className="font-medium text-gray-900">{po.expectedDate ? new Date(po.expectedDate).toLocaleDateString('en-IN') : 'Not Set'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Payment Terms</p>
                <p className="font-medium text-gray-900">{po.paymentTerms || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Reference No</p>
                <p className="font-medium text-gray-900">{po.reference || 'None'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Destination</p>
                <p className="font-medium text-gray-900">{po.warehouse || 'Central Warehouse'}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
