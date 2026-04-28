'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiUrl, getApiHeaders, getStoreForApi } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';
import BannerParserUploader, { ParsedBannerFile } from '@/components/BannerParserUploader';

interface Banner {
  _id: string;
  title?: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
  width?: number;
  height?: number;
}

export default function LandingPageManager() {
  const router = useRouter();
  const { adminToken, logoutAdmin } = useAuth();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<ParsedBannerFile[]>([]);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [uploaderClearSignal, setUploaderClearSignal] = useState(0);
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const [titleSavingId, setTitleSavingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [reorderLoading, setReorderLoading] = useState(false);
  const addBannerCardRef = useRef<HTMLFormElement | null>(null);
  const [addBannerCardHeight, setAddBannerCardHeight] = useState<number | null>(null);
  const [topPicksTitle, setTopPicksTitle] = useState('Top Picks');
  const [topPicksSubheading, setTopPicksSubheading] = useState('Curated products selected by our store team');
  const [topPicksCount, setTopPicksCount] = useState(4);
  const [topPicksProductIds, setTopPicksProductIds] = useState<string[]>([]);
  const [isTopPicksLoading, setIsTopPicksLoading] = useState(true);
  const [isTopPicksSaving, setIsTopPicksSaving] = useState(false);

  const loadBanners = async () => {
    if (!adminToken) return;

    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(buildApiUrl('/api/landing/banners/admin'), {
        headers: getApiHeaders(adminToken),
      });

      if (response.status === 401) {
        logoutAdmin();
        router.push('/admin');
        return;
      }

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load banners');
      }

      const nextBanners: Banner[] = payload.data || [];
      setBanners(nextBanners);
      setTitleDrafts(
        nextBanners.reduce<Record<string, string>>((acc, banner) => {
          acc[banner._id] = banner.title || '';
          return acc;
        }, {})
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load banners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [adminToken]);

  const loadTopPicksSettings = async () => {
    if (!adminToken) return;

    try {
      setIsTopPicksLoading(true);

      const response = await fetch(buildApiUrl('/api/landing/top-picks/admin'), {
        headers: getApiHeaders(adminToken),
      });

      if (response.status === 401) {
        logoutAdmin();
        router.push('/admin');
        return;
      }

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load top picks settings');
      }

      const config = payload.data?.config || {};
      setTopPicksTitle(config.title || 'Top Picks');
      setTopPicksSubheading(config.subheading || '');
      setTopPicksCount(Number(config.productCount || 4));
      setTopPicksProductIds(Array.isArray(config.productIds) ? config.productIds : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load top picks settings');
    } finally {
      setIsTopPicksLoading(false);
    }
  };

  useEffect(() => {
    loadTopPicksSettings();
  }, [adminToken]);

  useEffect(() => {
    const element = addBannerCardRef.current;
    if (!element) return;

    const updateHeight = () => {
      setAddBannerCardHeight(element.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);

    return () => observer.disconnect();
  }, [title, selectedFiles, displayOrder, isActive, isSaving, error, message]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;
    if (selectedFiles.length === 0) {
      setError('Please select at least one banner image');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setMessage('');

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const item = selectedFiles[index];

        const uploadFormData = new FormData();
        uploadFormData.append('file', item.file);
        uploadFormData.append('folder', 'landing-banners');

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
          throw new Error(uploadPayload.error || uploadPayload.message || `Failed to upload banner image: ${item.file.name}`);
        }

        const response = await fetch(buildApiUrl('/api/landing/banners'), {
          method: 'POST',
          headers: getApiHeaders(adminToken),
          body: JSON.stringify({
            title,
            imageUrl: uploadPayload.url,
            displayOrder: displayOrder + index,
            isActive,
            width: item.width,
            height: item.height,
          }),
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || `Failed to create banner for image: ${item.file.name}`);
        }
      }

      setMessage(`${selectedFiles.length} banner(s) created successfully.`);
      setTitle('');
      setSelectedFiles([]);
      setDisplayOrder(0);
      setIsActive(true);
      setUploaderClearSignal((prev) => prev + 1);
      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create banner');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleBanner = async (banner: Banner) => {
    if (!adminToken) return;

    try {
      setError('');
      const response = await fetch(buildApiUrl(`/api/landing/banners/${banner._id}`), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify({ isActive: !banner.isActive }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update banner');
      }

      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update banner');
    }
  };

  const saveBannerTitle = async (banner: Banner) => {
    if (!adminToken) return;

    const nextTitle = (titleDrafts[banner._id] || '').trim();
    const currentTitle = (banner.title || '').trim();
    if (nextTitle === currentTitle) return;

    try {
      setError('');
      setMessage('');
      setTitleSavingId(banner._id);

      const response = await fetch(buildApiUrl(`/api/landing/banners/${banner._id}`), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify({ title: nextTitle }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to update banner title');
      }

      setMessage('Banner title updated.');
      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update banner title');
    } finally {
      setTitleSavingId(null);
    }
  };

  const deleteBanner = async (banner: Banner) => {
    if (!adminToken) return;
    if (!window.confirm('Delete this banner?')) return;

    try {
      setError('');
      const response = await fetch(buildApiUrl(`/api/landing/banners/${banner._id}`), {
        method: 'DELETE',
        headers: getApiHeaders(adminToken),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to delete banner');
      }

      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete banner');
    }
  };

  const persistReorder = async (nextBanners: Banner[]) => {
    if (!adminToken) return;

    try {
      setReorderLoading(true);
      setError('');

      const orderedBannerIds = nextBanners.map((banner) => banner._id);
      const response = await fetch(buildApiUrl('/api/landing/banners/reorder'), {
        method: 'PATCH',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify({ orderedBannerIds }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to reorder banners');
      }

      await loadBanners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder banners');
      await loadBanners();
    } finally {
      setReorderLoading(false);
    }
  };

  const handleDragStart = (bannerId: string) => {
    setDraggedId(bannerId);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = banners.findIndex((banner) => banner._id === draggedId);
    const targetIndex = banners.findIndex((banner) => banner._id === targetId);
    if (draggedIndex < 0 || targetIndex < 0) return;

    const nextBanners = [...banners];
    const [draggedBanner] = nextBanners.splice(draggedIndex, 1);
    nextBanners.splice(targetIndex, 0, draggedBanner);

    setBanners(nextBanners);
    setDraggedId(null);

    await persistReorder(nextBanners);
  };

  const saveTopPicksSettings = async () => {
    if (!adminToken) return;

    try {
      setIsTopPicksSaving(true);
      setError('');
      setMessage('');

      const response = await fetch(buildApiUrl('/api/landing/top-picks/admin'), {
        method: 'PUT',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify({
          title: topPicksTitle,
          subheading: topPicksSubheading,
          productCount: topPicksCount,
          productIds: topPicksProductIds,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to save top picks settings');
      }

      setMessage('Top picks settings saved successfully.');
      await loadTopPicksSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save top picks settings');
    } finally {
      setIsTopPicksSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Landing Page</h1>
        <p className="text-sm text-gray-600 mt-1">Hero banner manager (recommended banner size: 1920 × 600)</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <form ref={addBannerCardRef} onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Add Banner</h2>

          <BannerParserUploader
            clearSignal={uploaderClearSignal}
            onFilesSelect={(files) => {
              setSelectedFiles(files);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Summer Sale Banner"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Selected Banners</label>
              <div className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-700 truncate">
                {selectedFiles.length > 0 ? `${selectedFiles.length} image(s) selected` : 'Select banner image(s) using parser above'}
              </div>
              {selectedFiles.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">Banners will be created in sequence starting from order {displayOrder}</p>
              )}
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

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
          >
            {isSaving ? 'Saving...' : `Add Banner${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
        </form>

        <div
          className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col min-h-0"
          style={addBannerCardHeight ? { height: addBannerCardHeight } : undefined}
        >
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Existing Banners</h3>
            <p className="text-xs text-gray-500 mt-1">Edit title for SEO and drag rows to reorder</p>
          </div>

          {isLoading ? (
            <div className="p-6 text-gray-600 text-sm">Loading banners...</div>
          ) : banners.length === 0 ? (
            <div className="p-6 text-gray-600 text-sm">No banners added yet.</div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs uppercase font-semibold text-gray-600">Title</th>
                    <th className="px-4 py-2 text-left text-xs uppercase font-semibold text-gray-600">Order</th>
                    <th className="px-4 py-2 text-left text-xs uppercase font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-xs uppercase font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banners.map((banner, index) => (
                    <tr
                      key={banner._id}
                      draggable
                      onDragStart={() => handleDragStart(banner._id)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(banner._id)}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-move"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <input
                          value={titleDrafts[banner._id] ?? ''}
                          onChange={(e) =>
                            setTitleDrafts((prev) => ({
                              ...prev,
                              [banner._id]: e.target.value,
                            }))
                          }
                          placeholder={`Banner ${index + 1}`}
                          className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{index}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveBannerTitle(banner)}
                            disabled={titleSavingId === banner._id || (titleDrafts[banner._id] || '').trim() === (banner.title || '').trim()}
                            className="px-2.5 py-1 border border-blue-300 rounded text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                          >
                            {titleSavingId === banner._id ? 'Saving...' : 'Save Title'}
                          </button>
                          <button
                            onClick={() => toggleBanner(banner)}
                            className="px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                          >
                            {banner.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => deleteBanner(banner)}
                            className="px-2.5 py-1 border border-red-300 rounded text-xs text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reorderLoading && <div className="px-4 py-2 text-xs text-blue-600 border-t border-gray-200">Saving banner order...</div>}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Top Picks Section</h2>
          <p className="text-xs text-gray-500 mt-1">Set title, subheading, and number of products. Product selection is managed from Products table using Top Pick marker.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Section Title</label>
            <input
              value={topPicksTitle}
              onChange={(e) => setTopPicksTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Top Picks"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Subheading</label>
            <input
              value={topPicksSubheading}
              onChange={(e) => setTopPicksSubheading(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Curated products selected by our store team"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Number of Products</label>
            <input
              type="number"
              min={1}
              max={12}
              value={topPicksCount}
              onChange={(e) => setTopPicksCount(Number(e.target.value || 4))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="text-sm text-gray-700">
          {isTopPicksLoading ? 'Loading selected products count...' : `Selected from Products table: ${topPicksProductIds.length} product(s)`}
        </div>

        <button
          type="button"
          onClick={saveTopPicksSettings}
          disabled={isTopPicksSaving}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
        >
          {isTopPicksSaving ? 'Saving...' : 'Save Top Picks Settings'}
        </button>
      </div>
    </div>
  );
}
