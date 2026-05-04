'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { FiUpload, FiX } from 'react-icons/fi';
import StaticPagesSettingsPanel from '@/components/pages/StaticPagesSettingsPanel';
import FooterSettingsPanel from '@/components/pages/FooterSettingsPanel';

interface WebsiteLogo {
  _id: string;
  logoUrl: string;
  alt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WebsiteSettingsPage() {
  const { adminToken } = useAuth();
  const [logos, setLogos] = useState<WebsiteLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<WebsiteLogo | null>(null);

  // Fetch logos on mount
  useEffect(() => {
    fetchLogos();
  }, []);

  const fetchLogos = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(buildApiUrl('/api/landing/website-logo/admin'), {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch logos');

      const payload = await res.json();
      const allLogos = Array.isArray(payload?.data) ? payload.data : [];
      setLogos(allLogos);
      setStatusMsg('');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load logos');
    } finally {
      setIsLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setSelectedFile(null);
    setPreviewUrl('');
    setAltText('');
    setShowModal(true);
  };

  const openEdit = (logo: WebsiteLogo) => {
    setEditing(logo);
    setAltText(logo.alt || '');
    setPreviewUrl(logo.logoUrl);
    setSelectedFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setAltText('');
    setEditing(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch(buildApiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });

    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    return data.url;
  };

  const toggleActive = async (logo: WebsiteLogo) => {
    try {
      const res = await fetch(buildApiUrl(`/api/landing/website-logo/admin/${logo._id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ isActive: !logo.isActive })
      });

      if (!res.ok) throw new Error('Failed to update logo status');

      fetchLogos();
      setStatusMsg(logo.isActive ? 'Logo deactivated' : 'Logo activated');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Update failed');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalLogoUrl = previewUrl;

      // Upload new file if selected
      if (selectedFile) {
        finalLogoUrl = await uploadFile(selectedFile, 'website-logos');
      }

      const endpoint = editing
        ? `/api/landing/website-logo/admin/${editing._id}`
        : '/api/landing/website-logo/admin';

      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(buildApiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          logoUrl: finalLogoUrl,
          alt: altText || 'Store Logo',
          isActive: true
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.message || 'Failed to save logo');
      }

      setStatusMsg(editing ? 'Logo updated' : 'Logo created');
      await fetchLogos();
      closeModal();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (logoId: string) => {
    if (!window.confirm('Delete this logo?')) return;

    try {
      const res = await fetch(buildApiUrl(`/api/landing/website-logo/admin/${logoId}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete logo');

      setStatusMsg('Logo deleted');
      await fetchLogos();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Website Settings</h1>
            <p className="mt-2 text-gray-600">Manage your store logo (horizontal format)</p>
          </div>
          <Button variant="primary" onClick={openCreate}>+ Add Logo</Button>
        </div>
 
        {statusMsg && (
          <div className="mb-6 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">
            {statusMsg}
          </div>
        )}

        {isLoading ? (
          <p className="text-gray-600">Loading logos...</p>
        ) : logos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No logos uploaded yet</p>
            <Button variant="primary" onClick={openCreate}>Upload First Logo</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logos.map((logo) => (
              <div key={logo._id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                {/* Logo Preview */}
                <div className="h-32 bg-white p-4 flex items-center justify-center border-b border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={logo.logoUrl} 
                    alt={logo.alt} 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Logo Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Alt Text</p>
                    <p className="text-sm font-medium text-gray-900">{logo.alt || '-'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      logo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {logo.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Updated</p>
                    <p className="text-xs text-gray-600">
                      {new Date(logo.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => openEdit(logo)}
                    >
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant={logo.isActive ? 'danger' : 'success'}
                      onClick={() => toggleActive(logo)}
                    >
                      {logo.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="danger" 
                      onClick={() => handleDelete(logo._id)}
                      className="!p-1"
                    >
                      <FiX />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Modal 
          isOpen={showModal} 
          title={editing ? 'Edit Logo' : 'Upload Logo'} 
          onClose={closeModal} 
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-5 p-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo Image</label>
            <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1 inline-block mb-2">
              Recommended: Horizontal logo (landscape), 1920 × 600 px
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="logo-upload"
              />
              <label htmlFor="logo-upload" className="cursor-pointer">
                <FiUpload className="mx-auto text-3xl text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">Click to upload</p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
              </label>
            </div>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="w-full h-24 flex items-center justify-center bg-white rounded">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={previewUrl} 
                    alt="preview" 
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (SEO)</label>
            <input 
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="e.g., Plants Mall Store Logo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Displayed if image fails to load</p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {editing ? 'Update Logo' : 'Upload Logo'}
            </Button>
          </div>
          </form>
        </Modal>
      </div>
      <StaticPagesSettingsPanel />
      <FooterSettingsPanel />
    </>
  );
}
