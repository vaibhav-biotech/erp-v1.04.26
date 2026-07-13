'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import FeaturedCollectionsBackgroundManager from '@/components/pages/FeaturedCollectionsBackgroundManager';
import type { Column } from '@/components/DataTable';
import { buildApiUrl, fetchWithStore, getStoreForApi } from '@/lib/storeConfig';

interface FeaturedCollectionItem {
  _id: string;
  title: string;
  subtitle?: string;
  tag: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt?: string;
}

interface FormState {
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

const defaultForm: FormState = {
  title: '',
  subtitle: '',
  tag: '',
  imageUrl: '',
  isActive: true,
  displayOrder: 0,
};

const getAdminToken = () => (typeof window !== 'undefined' ? localStorage.getItem('adminToken') || undefined : undefined);

const toTagSlug = (value: string) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

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

export default function FeaturedCollectionsSettingsPage() {
  const [items, setItems] = useState<FeaturedCollectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FeaturedCollectionItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [imageSource, setImageSource] = useState<'upload' | 'drive'>('upload');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [driveInput, setDriveInput] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    setStatusMsg('');
    try {
      const res = await fetchWithStore('/api/landing/featured-collections/admin', {
        token: getAdminToken(),
      });

      if (!res.ok) throw new Error('Failed to fetch featured collections');
      const data = await res.json();
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load featured collections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setImageSource('upload');
    setSelectedImageFile(null);
    setDriveInput('');
    setStatusMsg('');
    setShowModal(true);
  };

  const openEdit = (row: FeaturedCollectionItem) => {
    setEditing(row);
    const existingUrl = row.imageUrl || '';
    const isDriveUrl = existingUrl.includes('drive.google.com') || existingUrl.includes('uc?export=view');
    setForm({
      title: row.title || '',
      subtitle: row.subtitle || '',
      tag: row.tag || '',
      imageUrl: existingUrl,
      isActive: Boolean(row.isActive),
      displayOrder: Number(row.displayOrder ?? 0),
    });
    setImageSource(isDriveUrl ? 'drive' : 'upload');
    setSelectedImageFile(null);
    setDriveInput(isDriveUrl ? existingUrl : '');
    setStatusMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
    setImageSource('upload');
    setSelectedImageFile(null);
    setDriveInput('');
  };

  const toggleActive = async (row: FeaturedCollectionItem) => {
    try {
      const res = await fetchWithStore(`/api/landing/featured-collections/admin/${row._id}`, {
        method: 'PATCH',
        token: getAdminToken(),
        body: JSON.stringify({ isActive: !row.isActive }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to update status');
      }

      await loadItems();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');

    if (!form.title.trim()) {
      setStatusMsg('Title is required');
      return;
    }

    const nextTag = toTagSlug(form.tag || form.title);
    if (!nextTag) {
      setStatusMsg('Tag is required');
      return;
    }

    let finalImageUrl = imageSource === 'drive' ? normalizeImageUrl(driveInput) : form.imageUrl.trim();

    if (imageSource === 'upload') {
      if (!selectedImageFile && !finalImageUrl) {
        setStatusMsg('Please select image from desktop');
        return;
      }
    } else if (!finalImageUrl) {
      setStatusMsg('Please add Google Drive image link');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedImageFile) {
        const adminToken = getAdminToken();
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImageFile);
        uploadFormData.append('folder', 'featured-collections');

        const uploadResponse = await fetch(buildApiUrl('/api/upload'), {
          method: 'POST',
          headers: {
            'X-Store-Name': getStoreForApi(adminToken),
            ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
          },
          body: uploadFormData,
        });
        const uploadPayload = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok || !uploadPayload?.success || !uploadPayload?.url) {
          throw new Error(uploadPayload?.error || 'Failed to upload image');
        }
        finalImageUrl = uploadPayload.url;
      }

      const endpoint = editing
        ? `/api/landing/featured-collections/admin/${editing._id}`
        : '/api/landing/featured-collections/admin';

      const res = await fetchWithStore(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        token: getAdminToken(),
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim(),
          tag: nextTag,
          imageUrl: finalImageUrl,
          isActive: form.isActive,
          displayOrder: Number(form.displayOrder || 0),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to save featured collection');
      }

      closeModal();
      await loadItems();
      setStatusMsg(editing ? 'Featured collection updated' : 'Featured collection created');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column[] = [
    {
      key: 'imageUrl',
      label: 'Image',
      width: '120px',
      render: (value, row: FeaturedCollectionItem) => (
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={row.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      render: (value, row: FeaturedCollectionItem) => (
        <div>
          <div className="font-semibold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500 mt-1">{row.subtitle || '-'}</div>
        </div>
      ),
    },
    {
      key: 'tag',
      label: 'Tag',
      width: '160px',
      render: (value) => <code className="bg-gray-100 px-2 py-1 rounded text-xs">{value}</code>,
    },
    {
      key: 'isActive',
      label: 'Status',
      width: '120px',
      render: (value) => (
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Updated',
      width: '180px',
      render: (value) => <span className="text-xs text-gray-600">{value ? new Date(value).toLocaleString() : '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '240px',
      render: (_, row: FeaturedCollectionItem) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEdit(row)}>Edit</Button>
          <Button size="sm" variant={row.isActive ? 'danger' : 'success'} onClick={() => toggleActive(row)}>
            {row.isActive ? 'Set Inactive' : 'Set Active'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Featured Collections</h2>
          <p className="mt-1 text-sm text-gray-500">Create homepage collection cards powered by product tags.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Create Collection</Button>
      </div>

      {statusMsg && (
        <div className="mb-6 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">{statusMsg}</div>
      )}

      <div>
        <FeaturedCollectionsBackgroundManager />
      </div>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-gray-600">Loading featured collections...</p>
        ) : (
          <DataTable columns={columns} data={items} selectable={false} actions={false} />
        )}
      </div>

      <Modal isOpen={showModal} title={editing ? 'Edit Featured Collection' : 'Create Featured Collection'} onClose={closeModal} size="md">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value, tag: prev.tag || toTagSlug(e.target.value) }))}
              placeholder="Decor Plants"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={form.subtitle ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
              placeholder="Perfect plants for stylish spaces"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <input
              type="text"
              value={form.tag ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, tag: toTagSlug(e.target.value) }))}
              placeholder="decor-plants"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">This tag will open matching products later.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Collection Image</label>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button type="button" onClick={() => setImageSource('upload')} className={`px-3 py-2 text-sm ${imageSource === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}>Desktop Upload</button>
              <button type="button" onClick={() => setImageSource('drive')} className={`px-3 py-2 text-sm border-l border-gray-300 ${imageSource === 'drive' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}>Google Drive</button>
            </div>

            {imageSource === 'upload' ? (
              <div className="mt-3">
                <input type="file" accept="image/*" onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>
            ) : (
              <div className="mt-3">
                <input
                  type="text"
                  value={driveInput ?? ''}
                  onChange={(e) => {
                    setDriveInput(e.target.value);
                    setForm((prev) => ({ ...prev, imageUrl: normalizeImageUrl(e.target.value) }));
                  }}
                  placeholder="Paste Google Drive URL or file ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          {(selectedImageFile || form.imageUrl) && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="w-full max-w-xs aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                min={0}
                value={form.displayOrder ?? 0}
                onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value || 0) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-7">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))} className="h-4 w-4" />
              Active
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSaving}>{editing ? 'Update Collection' : 'Create Collection'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
