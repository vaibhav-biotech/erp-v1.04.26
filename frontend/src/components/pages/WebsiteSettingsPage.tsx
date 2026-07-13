'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders, getStoreForApi } from '@/lib/storeConfig';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { FiUpload, FiX, FiLayout, FiImage, FiMenu, FiSettings, FiStar, FiFileText, FiGift, FiMessageCircle, FiHeart, FiGift as FiGiftWrap } from 'react-icons/fi';

import StaticPagesSettingsPanel from '@/components/pages/StaticPagesSettingsPanel';
import FooterSettingsPanel from '@/components/pages/FooterSettingsPanel';
import NotificationBarPage from '@/components/pages/NotificationBarPage';
import LandingPageManager from '@/components/pages/LandingPageManager';
import CategorySectionSettingsPage from '@/components/pages/CategorySectionSettingsPage';
import FeaturedCollectionsSettingsPage from '@/components/pages/FeaturedCollectionsSettingsPage';
import GiftSectionSettingsPage from '@/components/pages/GiftSectionSettingsPage';
import CareSectionSettingsPage from '@/components/pages/CareSectionSettingsPage';
import OffersManager from '@/components/pages/OffersManager';
import OfferBackgroundManager from '@/components/pages/OfferBackgroundManager';
import GiftWrapSettingsPage from '@/components/pages/GiftWrapSettingsPage';
import DynamicSectionsManager from '@/components/pages/DynamicSectionsManager';

interface WebsiteLogo {
  _id: string;
  logoUrl: string;
  alt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type TabKey = 
  | 'branding'
  | 'notification-bar'
  | 'landing'
  | 'categories'
  | 'featured'
  | 'gift-section'
  | 'care-section'
  | 'offers'
  | 'gift-wrap'
  | 'dynamic-sections'
  | 'static-pages'
  | 'footer';

const TABS: { id: TabKey; label: string; icon: React.ReactNode }[] = [
  { id: 'branding', label: 'Branding & Logo', icon: <FiImage className="w-4 h-4" /> },
  { id: 'notification-bar', label: 'Notification Bar', icon: <FiMessageCircle className="w-4 h-4" /> },
  { id: 'landing', label: 'Landing & Hero', icon: <FiLayout className="w-4 h-4" /> },
  { id: 'categories', label: 'Category Section', icon: <FiMenu className="w-4 h-4" /> },
  { id: 'featured', label: 'Featured Collections', icon: <FiStar className="w-4 h-4" /> },
  { id: 'gift-section', label: 'Gift Section', icon: <FiGift className="w-4 h-4" /> },
  { id: 'care-section', label: 'Care Section', icon: <FiHeart className="w-4 h-4" /> },
  { id: 'offers', label: 'Offers & Promos', icon: <FiStar className="w-4 h-4" /> },
  { id: 'gift-wrap', label: 'Gift Wrap Options', icon: <FiGiftWrap className="w-4 h-4" /> },
  { id: 'dynamic-sections', label: 'Dynamic Sections', icon: <FiLayout className="w-4 h-4" /> },
  { id: 'static-pages', label: 'Static Pages', icon: <FiFileText className="w-4 h-4" /> },
  { id: 'footer', label: 'Footer Settings', icon: <FiSettings className="w-4 h-4" /> },
];

export default function WebsiteSettingsPage() {
  const { adminToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('branding');
  
  // Logo State
  const [logos, setLogos] = useState<WebsiteLogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<WebsiteLogo | null>(null);

  // Fetch logos on mount if branding tab
  useEffect(() => {
    if (!adminToken || activeTab !== 'branding') return;
    fetchLogos();
  }, [adminToken, activeTab]);

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
    if (!adminToken) throw new Error('Admin session expired. Please login again.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch(buildApiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'X-Store-Name': getStoreForApi(adminToken),
        'Authorization': `Bearer ${adminToken}`
      },
      body: formData
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || payload?.message || 'Upload failed');
    }
    const data = await res.json();
    if (!data?.url) throw new Error(data?.error || data?.message || 'Upload failed');
    return data.url;
  };

  const toggleActive = async (logo: WebsiteLogo) => {
    try {
      const res = await fetch(buildApiUrl(`/api/landing/website-logo/admin/${logo._id}`), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken || undefined),
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
        headers: getApiHeaders(adminToken || undefined),
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
        headers: getApiHeaders(adminToken || undefined)
      });

      if (!res.ok) throw new Error('Failed to delete logo');

      setStatusMsg('Logo deleted');
      await fetchLogos();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const renderBrandingTab = () => (
    <div className="bg-white rounded-lg shadow p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Website Logos</h2>
          <p className="mt-1 text-sm text-gray-500">Manage the main logo displayed on your storefront.</p>
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
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <FiImage className="mx-auto h-12 w-12 text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4 font-medium">No logos uploaded yet</p>
          <Button variant="primary" onClick={openCreate}>Upload First Logo</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {logos.map((logo) => (
            <div key={logo._id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col">
              {/* Logo Preview */}
              <div className="h-40 bg-white p-4 flex items-center justify-center border-b border-gray-200 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={logo.logoUrl} 
                  alt={logo.alt} 
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {/* Logo Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1 font-medium">Alt Text</p>
                    <p className="text-sm text-gray-900 truncate">{logo.alt || '-'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium">Status</p>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        logo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {logo.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1 font-medium text-right">Updated</p>
                      <p className="text-xs text-gray-600">
                        {new Date(logo.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    onClick={() => openEdit(logo)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant={logo.isActive ? 'secondary' : 'success'}
                    onClick={() => toggleActive(logo)}
                    className="flex-1"
                  >
                    {logo.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={() => handleDelete(logo._id)}
                    className="px-3"
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
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1 inline-block mb-3">
            Recommended: Horizontal logo (landscape), 1920 × 600 px
          </p>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors group">
            <input 
              type="file" 
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center">
              <div className="p-3 bg-gray-100 rounded-full group-hover:bg-white transition-colors mb-3">
                <FiUpload className="text-xl text-gray-500 group-hover:text-blue-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700 group-hover:text-blue-700">Click to upload</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 5MB</p>
            </label>
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="w-full h-24 flex items-center justify-center bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={previewUrl} 
                  alt="preview" 
                  className="max-h-full max-w-full object-contain p-2"
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <p className="text-xs text-gray-500 mt-1.5">Displayed if image fails to load or for screen readers</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
          <Button type="submit" variant="primary" loading={isSaving}>
            {editing ? 'Save Changes' : 'Upload Logo'}
          </Button>
        </div>
        </form>
      </Modal>
    </div>
  );

  const renderActiveTab = () => {
    switch(activeTab) {
      case 'branding': return renderBrandingTab();
      case 'notification-bar': return <NotificationBarPage />;
      case 'landing': return <LandingPageManager />;
      case 'categories': return <CategorySectionSettingsPage />;
      case 'featured': return <FeaturedCollectionsSettingsPage />;
      case 'gift-section': return <GiftSectionSettingsPage />;
      case 'care-section': return <CareSectionSettingsPage />;
      case 'offers': return (
        <div className="space-y-8">
          <OfferBackgroundManager />
          <OffersManager />
        </div>
      );
      case 'gift-wrap': return <GiftWrapSettingsPage />;
      case 'dynamic-sections': return <DynamicSectionsManager />;
      case 'static-pages': return <StaticPagesSettingsPanel />;
      case 'footer': return <FooterSettingsPanel />;
      default: return null;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto min-h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 flex-shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h1 className="text-lg font-bold text-gray-900">Website Settings</h1>
            <p className="text-xs text-gray-500 mt-1">Manage your storefront appearance</p>
          </div>
          <nav className="p-2 space-y-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className={`${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        {/* Render Tab Content */}
        <div className="pb-12">
          {renderActiveTab()}
        </div>
      </div>

    </div>
  );
}
