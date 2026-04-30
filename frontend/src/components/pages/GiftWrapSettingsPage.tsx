'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { FiPlus, FiEdit2, FiTrash2, FiGift, FiArrowUp, FiArrowDown } from 'react-icons/fi';

interface GiftWrapOption {
  _id: string;
  name: string;
  price: number;
  displayOrder: number;
}

export default function GiftWrapSettingsPage() {
  const { admin, adminToken } = useAuth();
  const [options, setOptions] = useState<GiftWrapOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', price: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchGiftWrapOptions();
  }, []);

  const fetchGiftWrapOptions = async () => {
    try {
      setIsLoading(true);
      const url = buildApiUrl('/api/admin/gift-wrap-options');
      console.log('🎁 Fetching gift wrap options from:', url);
      console.log('🎁 Admin token:', adminToken ? 'present' : 'missing');

      const res = await fetch(url, {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        }
      });

      console.log('🎁 Fetch response status:', res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error('🎁 Fetch error:', errorData);
        throw new Error(errorData?.error || `Failed to fetch gift wrap options (${res.status})`);
      }

      const payload = await res.json();
      console.log('🎁 Fetch payload:', payload);

      const allOptions = Array.isArray(payload?.data) ? payload.data : [];
      setOptions(allOptions);
      setStatusMsg('');
    } catch (error) {
      console.error('❌ Error fetching gift wrap options:', error);
      setStatusMsg(`Failed to load: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (option?: GiftWrapOption) => {
    if (option) {
      setEditingId(option._id);
      setFormData({ name: option.name, price: option.price });
    } else {
      setEditingId(null);
      setFormData({ name: '', price: 0 });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', price: 0 });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setStatusMsg('Please enter an option name');
      setStatusType('error');
      return;
    }

    if (formData.price < 0) {
      setStatusMsg('Price cannot be negative');
      setStatusType('error');
      return;
    }

    setIsSaving(true);
    setStatusMsg('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId
        ? buildApiUrl(`/api/admin/gift-wrap-options/${editingId}`)
        : buildApiUrl('/api/admin/gift-wrap-options');

      const body = editingId
        ? formData
        : formData;

      console.log('🎁 Saving gift wrap option:', {
        method,
        url,
        body,
        adminToken: adminToken ? 'present' : 'missing'
      });

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(body)
      });

      console.log('🎁 Response status:', res.status);
      const responseData = await res.json();
      console.log('🎁 Response data:', responseData);

      if (!res.ok) {
        const error = responseData?.error || 'Failed to save';
        throw new Error(error);
      }

      setStatusMsg(editingId ? 'Option updated successfully' : 'Option added successfully');
      setStatusType('success');
      handleCloseModal();
      await fetchGiftWrapOptions();
    } catch (error) {
      console.error('❌ Error saving:', error);
      setStatusMsg(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this gift wrap option?')) {
      return;
    }

    try {
      const res = await fetch(buildApiUrl(`/api/admin/gift-wrap-options/${id}`), {
        method: 'DELETE',
        headers: {
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete');

      setStatusMsg('Option deleted successfully');
      setStatusType('success');
      await fetchGiftWrapOptions();
    } catch (error) {
      console.error('Error deleting:', error);
      setStatusMsg('Failed to delete gift wrap option');
      setStatusType('error');
    }
  };

  const handleMoveUp = async (id: string, currentOrder: number) => {
    if (currentOrder === 1) return;

    // Find the option with displayOrder - 1 and swap
    const optionToMove = options.find(o => o._id === id);
    const optionAbove = options.find(o => o.displayOrder === currentOrder - 1);

    if (!optionToMove || !optionAbove) return;

    try {
      // Move current down
      await fetch(buildApiUrl(`/api/admin/gift-wrap-options/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ displayOrder: currentOrder - 1 })
      });

      // Move above down
      await fetch(buildApiUrl(`/api/admin/gift-wrap-options/${optionAbove._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ displayOrder: currentOrder })
      });

      await fetchGiftWrapOptions();
    } catch (error) {
      console.error('Error reordering:', error);
      setStatusMsg('Failed to reorder options');
      setStatusType('error');
    }
  };

  const handleMoveDown = async (id: string, currentOrder: number) => {
    const maxOrder = Math.max(...options.map(o => o.displayOrder));
    if (currentOrder === maxOrder) return;

    // Find the option with displayOrder + 1 and swap
    const optionToMove = options.find(o => o._id === id);
    const optionBelow = options.find(o => o.displayOrder === currentOrder + 1);

    if (!optionToMove || !optionBelow) return;

    try {
      // Move current down
      await fetch(buildApiUrl(`/api/admin/gift-wrap-options/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ displayOrder: currentOrder + 1 })
      });

      // Move below up
      await fetch(buildApiUrl(`/api/admin/gift-wrap-options/${optionBelow._id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ displayOrder: currentOrder })
      });

      await fetchGiftWrapOptions();
    } catch (error) {
      console.error('Error reordering:', error);
      setStatusMsg('Failed to reorder options');
      setStatusType('error');
    }
  };

  const sortedOptions = [...options].sort((a, b) => a.displayOrder - b.displayOrder);
  const maxOrder = sortedOptions.length > 0 ? Math.max(...sortedOptions.map(o => o.displayOrder)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FiGift size={28} className="text-amber-600" />
            <h1 className="text-2xl font-bold text-gray-900">Gift Wrap Settings</h1>
          </div>
          <p className="text-gray-600 mt-1">Manage gift wrap options available for customers</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium"
        >
          <FiPlus size={18} />
          Add Option
        </button>
      </div>

      {/* Status Message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-lg ${
            statusType === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMsg}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-amber-600 rounded-full" />
          </div>
          <p className="text-gray-600 mt-4">Loading gift wrap options...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedOptions.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <FiGift size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg mb-4">No gift wrap options yet</p>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
          >
            <FiPlus size={18} />
            Create First Option
          </button>
        </div>
      )}

      {/* Options Table */}
      {!isLoading && sortedOptions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Option Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Price (₹)</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedOptions.map((option, index) => (
                <tr key={option._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{option.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₹{option.price}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                      {option.displayOrder}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleMoveUp(option._id, option.displayOrder)}
                      disabled={option.displayOrder === 1}
                      className="inline-p-2 text-gray-600 hover:text-amber-600 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                      title="Move up"
                    >
                      <FiArrowUp size={18} />
                    </button>
                    <button
                      onClick={() => handleMoveDown(option._id, option.displayOrder)}
                      disabled={option.displayOrder === maxOrder}
                      className="inline-p-2 text-gray-600 hover:text-amber-600 disabled:text-gray-300 disabled:cursor-not-allowed transition"
                      title="Move down"
                    >
                      <FiArrowDown size={18} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(option)}
                      className="inline-p-2 text-gray-600 hover:text-blue-600 transition"
                      title="Edit"
                    >
                      <FiEdit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(option._id)}
                      className="inline-p-2 text-gray-600 hover:text-red-600 transition"
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Gift Wrap Option' : 'Add New Gift Wrap Option'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Option Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Gift Wrap, Premium Box, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Price (₹)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleCloseModal}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
