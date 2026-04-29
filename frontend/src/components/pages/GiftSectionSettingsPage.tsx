'use client';

import { useEffect, useState } from 'react';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import type { Column } from '@/components/DataTable';
import { buildApiUrl, fetchWithStore, getStoreForApi } from '@/lib/storeConfig';

interface GiftBannerItem {
  _id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  tag: string;
  isActive: boolean;
  displayOrder: number;
  updatedAt?: string;
}

interface FormState {
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  tag: string;
  isActive: boolean;
  displayOrder: number;
}

const defaultForm: FormState = {
  title: '',
  desktopImageUrl: '',
  mobileImageUrl: '',
  tag: 'gifts',
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

export default function GiftSectionSettingsPage() {
  const [items, setItems] = useState<GiftBannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GiftBannerItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const [desktopImageSource, setDesktopImageSource] = useState<'upload' | 'drive'>('upload');
  const [mobileImageSource, setMobileImageSource] = useState<'upload' | 'drive'>('upload');

  const [selectedDesktopFile, setSelectedDesktopFile] = useState<File | null>(null);
  const [selectedMobileFile, setSelectedMobileFile] = useState<File | null>(null);

  const [desktopDriveInput, setDesktopDriveInput] = useState('');
  const [mobileDriveInput, setMobileDriveInput] = useState('');

  const loadItems = async () => {
    setIsLoading(true);
    setStatusMsg('');
    try {
      const res = await fetchWithStore('/api/landing/gift-section/admin', {
        token: getAdminToken(),
      });

      if (!res.ok) throw new Error('Failed to fetch gift banners');
      const data = await res.json();
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load gift banners');
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
    setDesktopImageSource('upload');
    setMobileImageSource('upload');
    setSelectedDesktopFile(null);
    setSelectedMobileFile(null);
    setDesktopDriveInput('');
    setMobileDriveInput('');
    setStatusMsg('');
    setShowModal(true);
  };

  const openEdit = (row: GiftBannerItem) => {
    setEditing(row);

    const desktopExisting = row.desktopImageUrl || '';
    const mobileExisting = row.mobileImageUrl || '';
    const desktopIsDrive = desktopExisting.includes('drive.google.com') || desktopExisting.includes('uc?export=view');
    const mobileIsDrive = mobileExisting.includes('drive.google.com') || mobileExisting.includes('uc?export=view');

    setForm({
      title: row.title || '',
      desktopImageUrl: desktopExisting,
      mobileImageUrl: mobileExisting,
      tag: row.tag || 'gifts',
      isActive: Boolean(row.isActive),
      displayOrder: Number(row.displayOrder || 0),
    });

    setDesktopImageSource(desktopIsDrive ? 'drive' : 'upload');
    setMobileImageSource(mobileIsDrive ? 'drive' : 'upload');
    setSelectedDesktopFile(null);
    setSelectedMobileFile(null);
    setDesktopDriveInput(desktopIsDrive ? desktopExisting : '');
    setMobileDriveInput(mobileIsDrive ? mobileExisting : '');
    setStatusMsg('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(defaultForm);
    setDesktopImageSource('upload');
    setMobileImageSource('upload');
    setSelectedDesktopFile(null);
    setSelectedMobileFile(null);
    setDesktopDriveInput('');
    setMobileDriveInput('');
  };

  const toggleActive = async (row: GiftBannerItem) => {
    try {
      const res = await fetchWithStore(`/api/landing/gift-section/admin/${row._id}`, {
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

  const uploadFile = async (file: File, folder: string) => {
    const adminToken = getAdminToken();
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('folder', folder);

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

    return String(uploadPayload.url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');

    if (!form.title.trim()) {
      setStatusMsg('Banner name is required');
      return;
    }

    const nextTag = toTagSlug(form.tag || 'gifts');
    if (!nextTag) {
      setStatusMsg('Tag is required');
      return;
    }

    let finalDesktopImageUrl = desktopImageSource === 'drive' ? normalizeImageUrl(desktopDriveInput) : String(form.desktopImageUrl || '').trim();
    let finalMobileImageUrl = mobileImageSource === 'drive' ? normalizeImageUrl(mobileDriveInput) : String(form.mobileImageUrl || '').trim();

    if (desktopImageSource === 'upload' && !selectedDesktopFile && !finalDesktopImageUrl) {
      setStatusMsg('Please add desktop image (1920 x 1080)');
      return;
    }

    if (mobileImageSource === 'upload' && !selectedMobileFile && !finalMobileImageUrl) {
      setStatusMsg('Please add mobile image (1080 x 1350)');
      return;
    }

    if (desktopImageSource === 'drive' && !finalDesktopImageUrl) {
      setStatusMsg('Please add desktop Google Drive link');
      return;
    }

    if (mobileImageSource === 'drive' && !finalMobileImageUrl) {
      setStatusMsg('Please add mobile Google Drive link');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedDesktopFile) {
        finalDesktopImageUrl = await uploadFile(selectedDesktopFile, 'gift-banners/desktop');
      }

      if (selectedMobileFile) {
        finalMobileImageUrl = await uploadFile(selectedMobileFile, 'gift-banners/mobile');
      }

      const endpoint = editing
        ? `/api/landing/gift-section/admin/${editing._id}`
        : '/api/landing/gift-section/admin';

      const res = await fetchWithStore(endpoint, {
        method: editing ? 'PATCH' : 'POST',
        token: getAdminToken(),
        body: JSON.stringify({
          title: form.title.trim(),
          desktopImageUrl: finalDesktopImageUrl,
          mobileImageUrl: finalMobileImageUrl,
          tag: nextTag,
          isActive: form.isActive,
          displayOrder: Number(form.displayOrder || 0),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to save gift banner');
      }

      closeModal();
      await loadItems();
      setStatusMsg(editing ? 'Gift banner updated' : 'Gift banner created');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column[] = [
    {
      key: 'desktopImageUrl',
      label: 'Desktop 1920x1080',
      width: '140px',
      render: (value, row: GiftBannerItem) => (
        <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${row.title} desktop`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No image</div>
          )}
        </div>
      ),
    },
    {
      key: 'mobileImageUrl',
      label: 'Mobile 1080x1350',
      width: '140px',
      render: (value, row: GiftBannerItem) => (
        <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${row.title} mobile`} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No image</div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Banner Name',
      render: (value, row: GiftBannerItem) => (
        <div>
          <div className="font-semibold text-gray-900">{String(value || '-')}</div>
          <div className="text-xs text-gray-500 mt-1">Tag: {row.tag || 'gifts'}</div>
        </div>
      ),
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
      render: (_, row: GiftBannerItem) => (
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
    <div className="bg-white rounded-lg shadow p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gift Section</h1>
          <p className="mt-2 text-gray-600">Manage homepage gift banner shown below offers.</p>
        </div>
        <Button variant="primary" onClick={openCreate}>+ Add Banner</Button>
      </div>

      {statusMsg && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">{statusMsg}</div>
      )}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-gray-600">Loading gift banners...</p>
        ) : (
          <DataTable columns={columns} data={items} selectable={false} actions={false} />
        )}
      </div>

      <Modal isOpen={showModal} title={editing ? 'Edit Gift Banner' : 'Create Gift Banner'} onClose={closeModal} size="md">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Name (SEO)</label>
            <input
              type="text"
              value={form.title ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value, tag: prev.tag || toTagSlug(e.target.value) || 'gifts' }))}
              placeholder="Gift Collection Banner"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <input
              type="text"
              value={form.tag ?? 'gifts'}
              onChange={(e) => setForm((prev) => ({ ...prev, tag: toTagSlug(e.target.value) || 'gifts' }))}
              placeholder="gifts"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Banner click opens products by this tag. Recommended: gifts</p>
          </div>

          <div className="space-y-3 border border-gray-200 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Desktop Banner Image</label>
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1 inline-block mb-2">Recommended size: 1920 x 1080</p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button type="button" onClick={() => setDesktopImageSource('upload')} className={`px-3 py-2 text-sm ${desktopImageSource === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}>Desktop Upload</button>
              <button type="button" onClick={() => setDesktopImageSource('drive')} className={`px-3 py-2 text-sm border-l border-gray-300 ${desktopImageSource === 'drive' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}>Google Drive</button>
            </div>

            {desktopImageSource === 'upload' ? (
              <input type="file" accept="image/*" onChange={(e) => setSelectedDesktopFile(e.target.files?.[0] || null)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" />
            ) : (
              <input
                type="text"
                value={desktopDriveInput ?? ''}
                onChange={(e) => {
                  setDesktopDriveInput(e.target.value);
                  setForm((prev) => ({ ...prev, desktopImageUrl: normalizeImageUrl(e.target.value) }));
                }}
                placeholder="Paste Google Drive URL or file ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>

          <div className="space-y-3 border border-gray-200 rounded-lg p-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Banner Image</label>
              <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1 inline-block mb-2">Recommended size: 1080 x 1350</p>
            </div>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button type="button" onClick={() => setMobileImageSource('upload')} className={`px-3 py-2 text-sm ${mobileImageSource === 'upload' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}>Desktop Upload</button>
              <button type="button" onClick={() => setMobileImageSource('drive')} className={`px-3 py-2 text-sm border-l border-gray-300 ${mobileImageSource === 'drive' ? 'bg-blue-100 text-blue-700' : 'bg-white text-gray-700'}`}>Google Drive</button>
            </div>

            {mobileImageSource === 'upload' ? (
              <input type="file" accept="image/*" onChange={(e) => setSelectedMobileFile(e.target.files?.[0] || null)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white" />
            ) : (
              <input
                type="text"
                value={mobileDriveInput ?? ''}
                onChange={(e) => {
                  setMobileDriveInput(e.target.value);
                  setForm((prev) => ({ ...prev, mobileImageUrl: normalizeImageUrl(e.target.value) }));
                }}
                placeholder="Paste Google Drive URL or file ID"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            )}
          </div>

          {(selectedDesktopFile || selectedMobileFile || form.desktopImageUrl || form.mobileImageUrl) && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200 aspect-[8/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedDesktopFile ? URL.createObjectURL(selectedDesktopFile) : form.desktopImageUrl} alt="Desktop preview" className="w-full h-full object-cover" />
                </div>
                <div className="rounded-lg overflow-hidden bg-gray-100 border border-gray-200 aspect-[4/5] sm:aspect-[4/5] max-h-[240px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedMobileFile ? URL.createObjectURL(selectedMobileFile) : form.mobileImageUrl} alt="Mobile preview" className="w-full h-full object-cover" />
                </div>
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
            <Button type="submit" variant="primary" loading={isSaving}>{editing ? 'Update Banner' : 'Create Banner'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
