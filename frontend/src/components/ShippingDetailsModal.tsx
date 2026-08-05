import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface ShippingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { courierName: string; trackingNumber: string }) => void;
}

export default function ShippingDetailsModal({ isOpen, onClose, onSubmit }: ShippingDetailsModalProps) {
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  
  // Popular Indian/Global courier options
  const COURIER_OPTIONS = [
    'Delhivery',
    'BlueDart',
    'XpressBees',
    'Ecom Express',
    'Shadowfax',
    'Amazon Shipping',
    'DTDC',
    'FedEx',
    'DHL',
    'India Post',
    'Other'
  ];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName || !trackingNumber) {
      alert('Please fill in all shipping details');
      return;
    }
    onSubmit({ courierName, trackingNumber });
    
    // Reset after submit
    setCourierName('');
    setTrackingNumber('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Enter Shipping Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Partner / Courier
              </label>
              <select
                value={COURIER_OPTIONS.includes(courierName) ? courierName : (courierName ? 'Other' : '')}
                onChange={(e) => setCourierName(e.target.value === 'Other' ? '' : e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                required
              >
                <option value="" disabled>Select Courier</option>
                {COURIER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>
            
            {/* If 'Other' is selected or they type a custom one */}
            {(!COURIER_OPTIONS.includes(courierName) && courierName !== '') || courierName === 'Other' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Courier Name
                </label>
                <input
                  type="text"
                  value={courierName === 'Other' ? '' : courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="Enter courier name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tracking ID / AWB Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. 1234567890"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Confirm & Ship
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
