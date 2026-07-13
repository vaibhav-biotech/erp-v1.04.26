'use client';

import { useEffect, useMemo, useState } from 'react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import type { Column } from '@/components/DataTable';
import { buildApiUrl, fetchWithStore, getStoreForApi } from '@/lib/storeConfig';

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface CategorySectionItem {
  _id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt?: string;
}

interface FormState {
  categoryId: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

const defaultForm: FormState = {
  categoryId: '',
  imageUrl: '',
  isActive: true,
  displayOrder: 0,
};

const getAdminToken = () => (typeof window !== 'undefined' ? localStorage.getItem('adminToken') || undefined : undefined);

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

export default function CategorySectionSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<CategorySectionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CategorySectionItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [imageSource, setImageSource] = useState<'upload' | 'drive'>('upload');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [driveInput, setDriveInput] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setStatusMsg('');
    try {
      const [categoriesRes, sectionRes] = await Promise.all([
        fetchWithStore('/api/categories', { token: getAdminToken() }),
        fetchWithStore('/api/landing/category-section/admin', { token: getAdminToken() }),
      ]);

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData?.data) ? categoriesData.data : []);
      }

      if (sectionRes.ok) {
        const sectionData = await sectionRes.json();
        setItems(Array.isArray(sectionData?.data) ? sectionData.data : []);
      }
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load category section settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const usedCategoryIds = useMemo(() => new Set(items.map((item) => item.categoryId)), [items]);

  const selectableCategories = useMemo(() => {
    if (editing) return categories;
    return categories.filter((category) => !usedCategoryIds.has(category._id));
  }, [categories, usedCategoryIds, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setImageSource('upload');
    setSelectedImageFile(null);
    setDriveInput('');
    setStatusMsg('');
    setShowModal(true);
  };

  const openEdit = (row: CategorySectionItem) => {
    setEditing(row);
    setForm({
      categoryId: row.categoryId,
      imageUrl: row.imageUrl || '',
      isActive: Boolean(row.isActive),
      displayOrder: Number(row.displayOrder || 0),
    });
    setImageSource('drive');
    setSelectedImageFile(null);
    setDriveInput(row.imageUrl || '');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');

    if (!form.categoryId) {
      setStatusMsg('Please select category');
      return;
    }

    let finalImageUrl = '';

    if (imageSource === 'upload') {
      if (selectedImageFile) {
        finalImageUrl = '';
      } else if (form.imageUrl.trim()) {
        finalImageUrl = form.imageUrl.trim();
      } else {
        setStatusMsg('Please choose image file from desktop');
        return;
      }
    } else {
      finalImageUrl = normalizeImageUrl(driveInput);
      if (!finalImageUrl) {
        setStatusMsg('Please add Google Drive image link');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (selectedImageFile) {
        const adminToken = getAdminToken();
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImageFile);
        uploadFormData.append('folder', 'category-section');

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
        ? `/api/landing/category-section/admin/${editing._id}`
        : '/api/landing/category-section/admin';

      const res = await fetchWithStore(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        token: getAdminToken(),
        body: JSON.stringify({
          categoryId: form.categoryId,
          imageUrl: finalImageUrl,
          isActive: form.isActive,
          displayOrder: Number(form.displayOrder || 0),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to save item');
      }

      closeModal();
      await loadData();
      setStatusMsg(editing ? 'Category section updated' : 'Category section item created');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (row: CategorySectionItem) => {
    try {
      const res = await fetchWithStore(`/api/landing/category-section/admin/${row._id}`, {
        method: 'PATCH',
        token: getAdminToken(),
        body: JSON.stringify({ isActive: !row.isActive }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to update status');
      }

      await loadData();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const columns: Column[] = [
    {
      key: 'imageUrl',
      label: 'Icon Preview',
      width: '140px',
      render: (value, row: CategorySectionItem) => (
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={row.categoryName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs text-gray-400">No image</span>
          )}
        </div>
      ),
    },
    {
      key: 'categoryName',
      label: 'Category',
      render: (value) => <span className="font-semibold text-gray-900">{value}</span>,
    },
    {
      key: 'displayOrder',
      label: 'Order',
      width: '90px',
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
      width: '260px',
      render: (_, row: CategorySectionItem) => (
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
          <h2 className="text-xl font-bold text-gray-900">Category Section</h2>
          <p className="mt-1 text-sm text-gray-500">Manage circular category icons to show below hero section.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Add Category Card</Button>
      </div>

      {statusMsg && (
        <div className="mb-6 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">{statusMsg}</div>
      )}

      <div>
        {isLoading ? (
          <p className="text-gray-600">Loading category section...</p>
        ) : (
          <DataTable columns={columns} data={items} selectable={false} actions={false} />
        )}
      </div>

      <Modal
        isOpen={showModal}
        title={editing ? 'Edit Category Card' : 'Add Category Card'}
        onClose={closeModal}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              disabled={Boolean(editing)}
              required
            >
              <option value="">Select category</option>
              {selectableCategories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            {editing && <p className="text-xs text-gray-500 mt-1">Category cannot be changed in edit mode.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Circular Image Source</label>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setImageSource('upload')}
                className={`px-3 py-2 text-sm ${imageSource === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
              >
                Desktop Upload
              </button>
              <button
                type="button"
                onClick={() => setImageSource('drive')}
                className={`px-3 py-2 text-sm border-l border-gray-300 ${imageSource === 'drive' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}
              >
                Google Drive
              </button>
            </div>

            {imageSource === 'upload' ? (
              <div className="mt-3 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedImageFile(e.target.files?.[0] || null)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                />
                <p className="text-xs text-gray-500">Choose image from desktop. It will upload automatically on Save.</p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  value={driveInput}
                  onChange={(e) => {
                    setDriveInput(e.target.value);
                    setForm((prev) => ({ ...prev, imageUrl: normalizeImageUrl(e.target.value) }));
                  }}
                  placeholder="Paste Google Drive URL or file ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
                <p className="text-xs text-gray-500">Supports drive link formats and file ID.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                min={0}
                value={form.displayOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, displayOrder: Number(e.target.value || 0) }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-7">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4"
              />
              Active
            </label>
          </div>

          {(selectedImageFile || form.imageUrl) && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedImageFile ? URL.createObjectURL(selectedImageFile) : form.imageUrl}
                  alt="Category"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSaving}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
