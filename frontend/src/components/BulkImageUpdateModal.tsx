'use client';

import React, { useState } from 'react';
import { FiX, FiUpload, FiImage, FiTrash2, FiPlus } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface BulkImageUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

interface QueuedItem {
  id: string; // internal random id for list management
  sku: string;
  files: File[];
  previewUrls: string[];
}

export default function BulkImageUpdateModal({ isOpen, onClose, onUploadComplete }: BulkImageUpdateModalProps) {
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [currentSku, setCurrentSku] = useState('');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [currentPreviews, setCurrentPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      
      const validFiles = filesArray.filter(file => file.size <= MAX_SIZE);
      const invalidFiles = filesArray.filter(file => file.size > MAX_SIZE);
      
      if (invalidFiles.length > 0) {
        setError(`Files must be less than 10MB. Skipped: ${invalidFiles.map(f => f.name).join(', ')}`);
      } else {
        setError('');
      }

      if (validFiles.length > 0) {
        setCurrentFiles(prev => [...prev, ...validFiles]);
        const newPreviews = validFiles.map(file => URL.createObjectURL(file));
        setCurrentPreviews(prev => [...prev, ...newPreviews]);
      }
    }
  };

  const handleAddToQueue = () => {
    if (!currentSku.trim()) {
      setError('Please enter a Product ID (SKU)');
      return;
    }
    if (currentFiles.length === 0) {
      setError('Please select at least one image');
      return;
    }

    const newItem: QueuedItem = {
      id: Math.random().toString(36).substr(2, 9),
      sku: currentSku.trim().toUpperCase(),
      files: currentFiles,
      previewUrls: currentPreviews
    };

    setQueue(prev => [...prev, newItem]);
    
    // Reset current inputs
    setCurrentSku('');
    setCurrentFiles([]);
    setCurrentPreviews([]);
    setError('');
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.id !== id));
  };

  const handleUploadAll = async () => {
    if (queue.length === 0) return;
    
    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      const updates = [];

      // 1. Upload all images to S3
      for (const item of queue) {
        const uploadedUrls = [];
        for (const file of item.files) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'products');

          // We explicitly avoid spreading getApiHeaders to ensure NO Content-Type is set,
          // so the browser can correctly set multipart/form-data boundary.
          const headers: Record<string, string> = {
            'Authorization': `Bearer ${adminToken}`
          };
          
          const rawApiHeaders = getApiHeaders(adminToken || undefined);
          if (rawApiHeaders['X-Store-Name']) {
            headers['X-Store-Name'] = rawApiHeaders['X-Store-Name'];
          }

          // Use raw backend URL directly to bypass Next.js 10MB proxy limit
          const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050';
          const uploadUrl = `${backendUrl}/api/upload`;

          const uploadRes = await fetch(uploadUrl, {
            method: 'POST',
            headers,
            body: formData
          });

          if (!uploadRes.ok) {
            throw new Error(`Failed to upload an image for SKU ${item.sku}`);
          }

          const uploadData = await uploadRes.json();
          if (uploadData.success && uploadData.url) {
            uploadedUrls.push(uploadData.url);
          }
        }

        updates.push({
          sku: item.sku,
          images: uploadedUrls
        });
      }

      // 2. Send bulk update request
      const response = await fetch(buildApiUrl('/api/products/bulk-image-update'), {
        method: 'POST',
        headers: {
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update products');
      }

      setSuccess(`Successfully updated ${updates.length - (data.notFoundSkus?.length || 0)} products!`);
      if (data.notFoundSkus?.length > 0) {
        setError(`Could not find SKUs: ${data.notFoundSkus.join(', ')}`);
      } else {
        setTimeout(() => {
          onClose();
          setQueue([]);
          if (onUploadComplete) onUploadComplete();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Bulk image update error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bulk Image Update</h2>
            <p className="text-sm text-gray-500 mt-1">Queue up images for multiple products by SKU and upload all at once.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
            disabled={isUploading}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">{error}</div>}
          {success && <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">{success}</div>}
          
          {/* Add to queue form */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-start">
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Product ID (SKU)</label>
              <input
                type="text"
                placeholder="e.g. A9F3K2"
                value={currentSku}
                onChange={e => setCurrentSku(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                disabled={isUploading}
                maxLength={6}
              />
            </div>
            <div className="w-full md:w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Images</label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  disabled={isUploading}
                />
                <div className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg flex items-center gap-2 text-gray-600 hover:bg-gray-50 transition">
                  <FiImage />
                  <span className="text-sm truncate">
                    {currentFiles.length > 0 ? `${currentFiles.length} files selected` : 'Choose files...'}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/3 pt-6">
              <button
                onClick={handleAddToQueue}
                disabled={isUploading || !currentSku || currentFiles.length === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                <FiPlus /> Add to Queue
              </button>
            </div>
          </div>

          {/* Current Selection Previews */}
          {currentPreviews.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Current Selection ({currentPreviews.length})</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {currentPreviews.map((url, i) => (
                  <img key={i} src={url} alt={`Preview ${i}`} className="w-16 h-16 object-cover rounded border border-gray-200" />
                ))}
              </div>
            </div>
          )}

          {/* Queue List */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Upload Queue ({queue.length})</h3>
            
            {queue.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Queue is empty. Add products and images above.
              </div>
            ) : (
              <div className="space-y-4">
                {queue.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm gap-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900 uppercase tracking-wider">{item.sku}</span>
                      <span className="text-xs text-gray-500">{item.files.length} image{item.files.length !== 1 ? 's' : ''}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="flex gap-1.5 overflow-x-auto flex-1 max-w-[200px]">
                        {item.previewUrls.slice(0, 3).map((url, i) => (
                          <img key={i} src={url} alt={`Thumb ${i}`} className="w-10 h-10 object-cover rounded border border-gray-200" />
                        ))}
                        {item.previewUrls.length > 3 && (
                          <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                            +{item.previewUrls.length - 3}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveFromQueue(item.id)}
                        disabled={isUploading}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUploadAll}
            disabled={isUploading || queue.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2 font-medium shadow-sm"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <FiUpload />
                Upload & Assign All
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
