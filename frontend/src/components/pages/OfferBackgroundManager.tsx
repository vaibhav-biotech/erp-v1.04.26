'use client';

import { useEffect, useState } from 'react';
import { FiCheck, FiTrash2, FiUpload } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders, getStoreForApi } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

interface OfferBackground {
  _id: string;
  title?: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
}

export default function OfferBackgroundManager() {
  const { adminToken } = useAuth();

  const [items, setItems] = useState<OfferBackground[]>([]);
  const [title, setTitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBackgrounds = async () => {
    if (!adminToken) return;

    try {
      setIsLoading(true);
      setError('');
      const response = await fetch(buildApiUrl('/api/landing/offers/backgrounds/admin'), {
        headers: getApiHeaders(adminToken),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load offer backgrounds');
      }

      const nextItems = (payload.data || []) as OfferBackground[];
      setItems(nextItems);
      setDisplayOrder(nextItems.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offer backgrounds');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBackgrounds();
  }, [adminToken]);

  const handleCreate = async () => {
    if (!adminToken) return;
    if (!selectedFile) {
      setError('Please choose an image to upload');
      return;
    }

    try {
      setIsSaving(true);
      setError('');

      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('folder', 'offer-section-backgrounds');

      const uploadResponse = await fetch(buildApiUrl('/api/upload'), {
        method: 'POST',
        headers: {
          'X-Store-Name': getStoreForApi(adminToken),
          Authorization: `Bearer ${adminToken}`,
        },
        body: uploadFormData,
      });
      const uploadPayload = await uploadResponse.json();

      if (!uploadResponse.ok || !uploadPayload.success || !uploadPayload.url) {
        throw new Error(uploadPayload.error || uploadPayload.message || 'Failed to upload image');
      }

      const response = await fetch(buildApiUrl('/api/landing/offers/backgrounds'), {
        method: 'POST',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify({
          title,
          imageUrl: uploadPayload.url,
          isActive,
          displayOrder,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to create offer background');
      }

      setTitle('');
      setSelectedFile(null);
      setIsActive(true);
      await loadBackgrounds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create background');
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (item: OfferBackground) => {
    if (!adminToken) return;

    try {
      setError('');
      const response = await fetch(buildApiUrl(`/api/landing/offers/backgrounds/${item._id}`), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify({ isActive: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to activate background');
      }

      await loadBackgrounds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate background');
    }
  };

  const handleDelete = async (item: OfferBackground) => {
    if (!adminToken) return;
    if (!window.confirm('Delete this offer background image?')) return;

    try {
      setError('');
      const response = await fetch(buildApiUrl(`/api/landing/offers/backgrounds/${item._id}`), {
        method: 'DELETE',
        headers: getApiHeaders(adminToken),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete background');
      }

      await loadBackgrounds();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete background');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div>
        <h3 className="font-semibold text-gray-900">Offers Section Background</h3>
        <p className="text-xs text-gray-500 mt-1">Upload background image for public offers section and mark one as active.</p>
      </div>

      {error && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            placeholder="Offers BG"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Display Order</label>
          <input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value || 0))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center gap-2 text-sm text-gray-600 cursor-pointer hover:border-black transition">
        <FiUpload size={16} />
        <span>{selectedFile ? selectedFile.name : 'Choose background image'}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
        />
      </label>

      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Set Active
      </label>

      <button
        type="button"
        onClick={handleCreate}
        disabled={isSaving}
        className="px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black disabled:opacity-50"
      >
        {isSaving ? 'Uploading...' : 'Upload Background'}
      </button>

      {isLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-gray-500">No background images uploaded yet.</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full min-w-[520px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 py-2 text-xs uppercase text-gray-600">Image</th>
                <th className="text-left px-3 py-2 text-xs uppercase text-gray-600">Title</th>
                <th className="text-left px-3 py-2 text-xs uppercase text-gray-600">Order</th>
                <th className="text-left px-3 py-2 text-xs uppercase text-gray-600">Status</th>
                <th className="text-left px-3 py-2 text-xs uppercase text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-gray-100">
                  <td className="px-3 py-2">
                    <img src={item.imageUrl} alt={item.title || 'bg'} className="w-14 h-10 rounded object-cover" />
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">{item.title || '-'}</td>
                  <td className="px-3 py-2 text-sm text-gray-700">{item.displayOrder}</td>
                  <td className="px-3 py-2 text-sm">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleActivate(item)}
                        disabled={item.isActive}
                        className="p-1.5 rounded border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                        title="Set active"
                      >
                        <FiCheck size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded border border-red-300 text-red-700 hover:bg-red-50"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
