'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders, getStoreForApi } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

interface Offer {
  _id: string;
  title: string;
  description?: string;
  offerPercent: number;
  showOfferBadge?: boolean;
  discountRupees: number;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  productId: string;
  productName: string;
  productIds?: string[];
  productNames?: string[];
  ctaUrl: string;
  bannerImage: string;
  bannerGridSize: '250x250' | '500x250' | '600x600';
  gridPosition?: number;
  minimumOrderValue: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  displayOrder: number;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface Product {
  _id: string;
  name: string;
  category: string;
}

interface OfferForm {
  title: string;
  description: string;
  offerPercent: string;
  showOfferBadge: boolean;
  gridPosition: '1' | '2' | '3' | '4';
  categoryId: string;
  productIds: string[];
  ctaUrl: string;
  minimumOrderValue: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const slugify = (value: string) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const GRID_POSITION_MAP: Record<OfferForm['gridPosition'], { size: Offer['bannerGridSize']; label: string }> = {
  '1': { size: '250x250', label: 'Top Left - Small Square' },
  '2': { size: '250x250', label: 'Top Right - Small Square' },
  '3': { size: '500x250', label: 'Bottom Left - Wide Rectangle' },
  '4': { size: '600x600', label: 'Right Side - Big Square' },
};

const defaultForm: OfferForm = {
  title: '',
  description: '',
  offerPercent: '',
  showOfferBadge: true,
  gridPosition: '1',
  categoryId: '',
  productIds: [],
  ctaUrl: '',
  minimumOrderValue: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

export default function OffersManager() {
  const { adminToken } = useAuth();

  const [offers, setOffers] = useState<Offer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [form, setForm] = useState<OfferForm>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');

  const dynamicUrlPreview = useMemo(() => {
    if (editingId && form.ctaUrl) return form.ctaUrl;
    const titleSlug = slugify(form.title);
    if (!titleSlug) return '/offers/<offer-title>-<offer-id>';
    return `/offers/${titleSlug}-<offer-id>`;
  }, [editingId, form.ctaUrl, form.title]);

  const loadOffers = async () => {
    if (!adminToken) return;

    try {
      setIsLoading(true);
      const response = await fetch(buildApiUrl('/api/landing/offers/admin'), {
        headers: getApiHeaders(adminToken),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load offers');
      }

      setOffers(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/categories'), {
        headers: getApiHeaders(adminToken || undefined),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load categories');
      }

      setCategories(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  };

  const loadProductsForCategory = async (categoryId: string) => {
    if (!categoryId) {
      setProducts([]);
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`/api/products?status=active&category=${encodeURIComponent(categoryId)}&limit=200`), {
        headers: getApiHeaders(adminToken || undefined),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Failed to load products');
      }

      setProducts(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
    }
  };

  useEffect(() => {
    loadOffers();
    loadCategories();
  }, [adminToken]);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setSelectedBannerFile(null);
    setBannerPreview('');
    setProducts([]);
  };

  const openCreateModal = () => {
    resetForm();
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = async (offer: Offer) => {
    setError('');
    await loadProductsForCategory(offer.categoryId);

    const normalizedPosition = String(
      Math.min(Math.max(Number(offer.gridPosition ?? (offer.displayOrder ?? 0) + 1), 1), 4)
    ) as OfferForm['gridPosition'];
    setForm({
      title: offer.title || '',
      description: offer.description || '',
      offerPercent: offer.offerPercent ? String(offer.offerPercent) : '',
      showOfferBadge: offer.showOfferBadge !== false,
      gridPosition: normalizedPosition,
      categoryId: offer.categoryId || '',
      productIds: Array.isArray(offer.productIds)
        ? offer.productIds
        : (offer.productId ? [offer.productId] : []),
      ctaUrl: offer.ctaUrl || '',
      minimumOrderValue: offer.minimumOrderValue ? String(offer.minimumOrderValue) : '',
      startDate: offer.startDate ? String(offer.startDate).slice(0, 10) : '',
      endDate: offer.endDate ? String(offer.endDate).slice(0, 10) : '',
      isActive: !!offer.isActive,
    });
    setBannerPreview(offer.bannerImage || '');
    setSelectedBannerFile(null);
    setEditingId(offer._id);
    setIsModalOpen(true);
  };

  const uploadBannerIfNeeded = async (): Promise<string> => {
    if (!selectedBannerFile) {
      if (!bannerPreview) throw new Error('Banner image is required');
      return bannerPreview;
    }

    if (!adminToken) throw new Error('Admin auth required');

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedBannerFile);
    formData.append('folder', 'offer-banners');

    const uploadResponse = await fetch(buildApiUrl('/api/upload'), {
      method: 'POST',
      headers: {
        'X-Store-Name': getStoreForApi(adminToken),
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });

    const uploadPayload = await uploadResponse.json();
    setIsUploading(false);

    if (!uploadResponse.ok || !uploadPayload.success || !uploadPayload.url) {
      throw new Error(uploadPayload.error || uploadPayload.message || 'Failed to upload banner image');
    }

    return uploadPayload.url;
  };

  const handleSave = async () => {
    if (!adminToken) {
      setError('Admin session expired. Please login again.');
      return;
    }

    try {
      setError('');

      if (!form.title.trim()) throw new Error('Offer name is required');
      if (!form.categoryId) throw new Error('Please select category');
      if (!form.productIds.length) throw new Error('Please select at least one product from selected category');

      const percent = Number(form.offerPercent || 0);

      if (percent <= 0) {
        throw new Error('Enter valid offer percent');
      }

      const selectedGridSize = GRID_POSITION_MAP[form.gridPosition];
      const targetDisplayOrder = Number(form.gridPosition) - 1;

      const slotConflict = offers.find(
        (item) => item.displayOrder === targetDisplayOrder && item._id !== editingId
      );
      if (slotConflict) {
        throw new Error(`Grid ${form.gridPosition} is already used by "${slotConflict.title}". Edit that offer or choose another grid.`);
      }

      if (form.startDate && form.endDate && new Date(form.startDate) > new Date(form.endDate)) {
        throw new Error('Start date cannot be after end date');
      }

      setIsSaving(true);
      const bannerImage = await uploadBannerIfNeeded();

      const payload = {
        title: form.title,
        description: form.description,
        offerPercent: percent,
        showOfferBadge: form.showOfferBadge,
        discountRupees: 0,
        categoryId: form.categoryId,
        productIds: form.productIds,
        bannerImage,
        bannerGridSize: selectedGridSize.size,
        gridPosition: Number(form.gridPosition),
        minimumOrderValue: Number(form.minimumOrderValue || 0),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        isActive: form.isActive,
        displayOrder: targetDisplayOrder,
      };

      const endpoint = editingId ? `/api/landing/offers/${editingId}` : '/api/landing/offers';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(buildApiUrl(endpoint), {
        method,
        headers: getApiHeaders(adminToken),
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to save offer');
      }

      await loadOffers();
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save offer');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (!adminToken) return;
    if (!window.confirm('Delete this offer?')) return;

    try {
      setError('');
      const response = await fetch(buildApiUrl(`/api/landing/offers/${offerId}`), {
        method: 'DELETE',
        headers: getApiHeaders(adminToken),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete offer');
      }

      await loadOffers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete offer');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setForm((prev) => {
      const isSelected = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: isSelected
          ? prev.productIds.filter((id) => id !== productId)
          : [...prev.productIds, productId],
      };
    });
  };

  const formatDateValue = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Create Offer</h2>
          <p className="text-xs text-gray-500 mt-1">Single-column offer manager with category-wise product selection and banner upload.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
        >
          <FiPlus size={14} />
          Add Offer
        </button>
      </div>

      {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

      {isLoading ? (
        <div className="text-sm text-gray-600 py-4">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="text-sm text-gray-600 py-4">No offers found. Create your first offer.</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full min-w-[1320px] table-auto">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[240px]">Offer</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[120px] whitespace-nowrap">Discount</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[220px]">Category / Product</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[110px] whitespace-nowrap">Grid Size</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[220px] whitespace-nowrap">Dynamic URL</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[210px] whitespace-nowrap">Date Range</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[120px] whitespace-nowrap">Min Value</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[100px] whitespace-nowrap">Status</th>
                <th className="text-left px-4 py-3 text-xs uppercase text-gray-600 min-w-[110px] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-sm align-top">
                    <div className="flex items-center gap-2">
                      {offer.bannerImage ? <img src={offer.bannerImage} alt={offer.title} className="w-12 h-12 rounded-md object-cover flex-shrink-0" /> : null}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 leading-5">{offer.title}</div>
                        {offer.description ? <div className="text-xs text-gray-500 line-clamp-2 max-w-[240px]">{offer.description}</div> : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top whitespace-nowrap">
                    {offer.offerPercent > 0 ? `${offer.offerPercent}%` : '-'}
                    {offer.discountRupees > 0 ? ` / ₹${offer.discountRupees}` : ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top">
                    <div>{offer.categoryName || '-'}</div>
                    <div className="text-xs text-gray-500">
                      {Array.isArray(offer.productNames) && offer.productNames.length > 0
                        ? `${offer.productNames.length} selected`
                        : (offer.productName || '-')}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top whitespace-nowrap">{offer.bannerGridSize || '-'}</td>
                  <td className="px-4 py-3 text-sm align-top whitespace-nowrap">
                    <span className="text-blue-700">{offer.ctaUrl || '-'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top whitespace-nowrap">
                    {formatDateValue(offer.startDate)} → {formatDateValue(offer.endDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 align-top whitespace-nowrap">₹{offer.minimumOrderValue || 0}</td>
                  <td className="px-4 py-3 text-sm align-top whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm align-top whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(offer)} className="p-2 rounded hover:bg-blue-50 text-blue-700">
                        <FiEdit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(offer._id)} className="p-2 rounded hover:bg-red-50 text-red-700">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-xl border border-gray-200 shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Edit Offer' : 'Create Offer'}</h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="p-1.5 rounded hover:bg-gray-100"
              >
                <FiX size={16} />
              </button>
            </div>

            {error ? (
              <div className="mx-5 mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            ) : null}

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Offer Name *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Summer Combo Offer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Offer Percent *</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.offerPercent}
                  onChange={(e) => setForm((prev) => ({ ...prev, offerPercent: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Discount Badge</label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-2">
                  <input
                    type="checkbox"
                    checked={form.showOfferBadge}
                    onChange={(e) => setForm((prev) => ({ ...prev, showOfferBadge: e.target.checked }))}
                  />
                  Show % OFF badge on offer card
                </label>
                <p className="text-xs text-gray-500 mt-1">Untick if discount text is already printed in banner image.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Grid Position *</label>
                <select
                  value={form.gridPosition}
                  onChange={(e) => {
                    const nextPosition = e.target.value as OfferForm['gridPosition'];
                    setForm((prev) => ({
                      ...prev,
                      gridPosition: nextPosition,
                    }));
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="1">Grid 1 - 250 × 250 (Top Left)</option>
                  <option value="2">Grid 2 - 250 × 250 (Top Right)</option>
                  <option value="3">Grid 3 - 500 × 250 (Bottom Left)</option>
                  <option value="4">Grid 4 - 600 × 600 (Right Big)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: Grid {form.gridPosition} → {GRID_POSITION_MAP[form.gridPosition].size} ({GRID_POSITION_MAP[form.gridPosition].label})
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Minimum Cart Value (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={form.minimumOrderValue}
                  onChange={(e) => setForm((prev) => ({ ...prev, minimumOrderValue: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. 499"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="Optional short description"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Select Category *</label>
                <select
                  value={form.categoryId}
                  onChange={(e) => {
                    const nextCategoryId = e.target.value;
                    setForm((prev) => ({ ...prev, categoryId: nextCategoryId, productIds: [] }));
                    loadProductsForCategory(nextCategoryId);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Choose category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Select Products * (Multi-select)</label>
                <div className="w-full min-h-[120px] max-h-[180px] overflow-auto border border-gray-300 rounded-lg p-2 space-y-1 bg-white">
                  {!form.categoryId ? (
                    <p className="text-sm text-gray-500 px-1 py-1">Select category first</p>
                  ) : products.length === 0 ? (
                    <p className="text-sm text-gray-500 px-1 py-1">No products in this category</p>
                  ) : (
                    products.map((product) => (
                      <label
                        key={product._id}
                        className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.productIds.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-gray-800">{product.name}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Selected: {form.productIds.length} product(s) (tick to select)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Dynamic URL (Auto)</label>
                <input
                  value={dynamicUrlPreview}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Grid Size (From Position)</label>
                <input
                  value={`${GRID_POSITION_MAP[form.gridPosition].size} (${GRID_POSITION_MAP[form.gridPosition].label})`}
                  readOnly
                  className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Selected size: {GRID_POSITION_MAP[form.gridPosition].size}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Upload Banner *</label>
                <label className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-gray-600 cursor-pointer hover:border-black transition">
                  <FiUpload size={16} />
                  <span>Choose file to upload banner</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setSelectedBannerFile(file);
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setBannerPreview(url);
                      }
                    }}
                  />
                </label>
                {bannerPreview ? <img src={bannerPreview} alt="Banner preview" className="mt-2 h-24 rounded object-cover" /> : null}
              </div>

              <div className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || isUploading || !adminToken}
                className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : isSaving ? 'Saving...' : editingId ? 'Update Offer' : 'Create Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
