'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import type { Column } from '@/components/DataTable'; // Column is not generic
import { buildApiUrl, fetchWithStore, getStoreForApi } from '@/lib/storeConfig';

interface CareImageItem {
  _id: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt?: string;
}

interface FormState {
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

const defaultForm: FormState = {
  imageUrl: '',
  isActive: false,
  displayOrder: 0,
};

const getAdminToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('adminToken') || undefined : undefined;

const extractGoogleDriveId = (value: string): string | null => {
  const input = String(value || '').trim();
  if (!input) return null;
  const idFromPath = input.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
  if (idFromPath) return idFromPath;
  const idFromQuery = input.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1];
  if (idFromQuery) return idFromQuery;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
  return null;
};

const normalizeImageUrl = (value: string): string => {
  const input = String(value || '').trim();
  if (!input) return '';
  if (!input.includes('drive.google.com')) return input;
  const driveId = extractGoogleDriveId(input);
  if (!driveId) return input;
  return `https://drive.google.com/uc?export=view&id=${driveId}`;
};

export default function CareSectionSettingsPage() {
  const [items, setItems] = useState<CareImageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CareImageItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [imageSource, setImageSource] = useState<'upload' | 'drive'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [driveInput, setDriveInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const activeCount = items.filter((x) => x.isActive).length;

  const loadItems = async () => {
    setIsLoading(true);
    setStatusMsg('');
    try {
      const res = await fetchWithStore('/api/landing/care-section/admin', { token: getAdminToken() });
      if (!res.ok) throw new Error('Failed to fetch care images');
      const data = await res.json();
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadItems(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setImageSource('upload');
    setSelectedFile(null);
    setDriveInput('');
    setPreviewUrl('');
    setStatusMsg('');
    setShowModal(true);
  };

  const openEdit = (row: CareImageItem) => {
    setEditing(row);
    const isDrive =
      row.imageUrl.includes('drive.google.com') || row.imageUrl.includes('uc?export=view');
    setForm({ imageUrl: row.imageUrl ?? '', isActive: Boolean(row.isActive), displayOrder: Number(row.displayOrder || 0) });
    setImageSource(isDrive ? 'drive' : 'upload');
    setSelectedFile(null);
    setDriveInput(isDrive ? row.imageUrl : '');
    setPreviewUrl(row.imageUrl ?? '');
    setStatusMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
    setImageSource('upload');
    setSelectedFile(null);
    setDriveInput('');
    setPreviewUrl('');
  };

  const toggleActive = async (row: CareImageItem) => {
    if (!row.isActive && activeCount >= 3) {
      setStatusMsg('Max 3 active images allowed. Deactivate one first.');
      return;
    }
    try {
      const res = await fetchWithStore(`/api/landing/care-section/admin/${row._id}`, {
        method: 'PATCH',
        token: getAdminToken(),
        body: JSON.stringify({ isActive: !row.isActive }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to update');
      }
      await loadItems();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to update');
    }
  };

  const uploadFile = async (file: File) => {
    const adminToken = getAdminToken();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'care-section');
    const uploadRes = await fetch(buildApiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'X-Store-Name': getStoreForApi(adminToken),
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: fd,
    });
    const payload = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !payload?.success || !payload?.url) {
      throw new Error(payload?.error || 'Upload failed');
    }
    return payload.url as string;
  };

  const handleSave = async () => {
    setStatusMsg('');
    setIsSaving(true);
    try {
      let finalImageUrl = form.imageUrl ?? '';

      if (imageSource === 'upload') {
        if (selectedFile) {
          finalImageUrl = await uploadFile(selectedFile);
        } else if (!finalImageUrl) {
          throw new Error('Please upload an image');
        }
      } else {
        finalImageUrl = normalizeImageUrl(driveInput);
        if (!finalImageUrl) throw new Error('Please enter a valid Google Drive URL or ID');
      }

      if (form.isActive && activeCount >= 3 && !editing?.isActive) {
        throw new Error('Max 3 active images allowed. Deactivate one first.');
      }

      const body: Record<string, unknown> = {
        imageUrl: finalImageUrl,
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      };

      if (editing) {
        const res = await fetchWithStore(`/api/landing/care-section/admin/${editing._id}`, {
          method: 'PATCH',
          token: getAdminToken(),
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to update');
        setStatusMsg('Image updated successfully');
      } else {
        const res = await fetchWithStore('/api/landing/care-section/admin', {
          method: 'POST',
          token: getAdminToken(),
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.message || 'Failed to create');
        setStatusMsg('Image added successfully');
      }

      closeModal();
      await loadItems();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column[] = [
    {
      label: 'Preview',
      key: 'imageUrl',
      render: (_val, row) =>
        row.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.imageUrl} alt="care" className="w-16 h-20 object-cover rounded" />
        ) : (
          <span className="text-gray-400 text-sm">No image</span>
        ),
    },
    {
      label: 'Order',
      key: 'displayOrder',
      render: (_val, row) => <span className="text-sm text-gray-600">{row.displayOrder}</span>,
    },
    {
      label: 'Status',
      key: 'isActive',
      render: (_val, row) => (
        <button
          onClick={() => toggleActive(row)}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            row.isActive
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      label: 'Actions',
      key: '_id',
      render: (_val, row) => (
        <button
          onClick={() => openEdit(row)}
          className="text-sm text-blue-600 hover:underline"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Care Section</h2>
          <p className="mt-1 text-sm text-gray-500">
            "Crafted with Care" grid — max 3 active images shown on landing page
          </p>
        </div>
        <Button onClick={openCreate} variant="primary" size="sm">
          + Add Image
        </Button>
      </div>

      {statusMsg && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            statusMsg.toLowerCase().includes('success')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {statusMsg}
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            activeCount >= 3
              ? 'bg-amber-100 text-amber-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {activeCount} / 3 active
        </span>
        <span className="text-xs text-gray-400">Recommended image size: 640 × 800 px (portrait)</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <DataTable columns={columns} data={items} />
      )}

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editing ? 'Edit Care Image' : 'Add Care Image'}
        >
          <div className="space-y-5 p-1">
            {/* Image source toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Source</label>
              <div className="flex gap-2">
                {(['upload', 'drive'] as const).map((src) => (
                  <button
                    key={src}
                    onClick={() => setImageSource(src)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      imageSource === src
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {src === 'upload' ? 'Upload File' : 'Google Drive'}
                  </button>
                ))}
              </div>
            </div>

            {/* Upload or Drive input */}
            {imageSource === 'upload' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image File
                </label>
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1 inline-block mb-2">
                  Recommended size: 640 × 800 px (portrait)
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    setSelectedFile(f);
                    if (f) setPreviewUrl(URL.createObjectURL(f));
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Drive URL or File ID
                </label>
                <input
                  type="text"
                  value={driveInput ?? ''}
                  onChange={(e) => {
                    setDriveInput(e.target.value);
                    setPreviewUrl(normalizeImageUrl(e.target.value));
                  }}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
              </div>
            )}

            {/* Preview */}
            {previewUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="preview"
                  className="max-h-48 w-auto rounded border object-contain"
                  onError={() => setPreviewUrl('')}
                />
              </div>
            )}

            {/* Display order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={form.displayOrder ?? 0}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                className="w-24 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Active</label>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              {form.isActive && activeCount >= 3 && !editing?.isActive && (
                <span className="text-xs text-red-600">Max 3 active — deactivate one first</span>
              )}
            </div>

            {statusMsg && (
              <p className="text-sm text-red-600">{statusMsg}</p>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button onClick={closeModal} variant="secondary" size="sm" disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} variant="primary" size="sm" disabled={isSaving}>
                {isSaving ? 'Saving…' : editing ? 'Save Changes' : 'Add Image'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
