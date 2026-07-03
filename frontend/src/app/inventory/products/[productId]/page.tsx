'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders, getStoreForApi } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
  _id: string;
  name: string;
  subcategories?: Array<{ name: string; slug: string }>;
}

interface VariantForm {
  id: number;
  name: string;
  price: string;
  tag?: string;
}

interface ProductFormState {
  name: string;
  category: string;
  subcategory: string;
  tags: string[];
  originalPrice: string;
  discount: string;
  rating: string;
  reviews: string;
  stock: string;
  status: 'active' | 'inactive' | 'draft';
  description: string;
  benefits: string;
  care: string;
  images: string[];
  sizeVariants: VariantForm[];
  potVariants: VariantForm[];
}

const toNumber = (value: string, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTag = (value: string) => String(value || '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

export default function InventoryAdminProductDetailsPage() {
  const params = useParams<{ productId: string }>();
  const productId = params?.productId;
  const { adminToken } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [form, setForm] = useState<ProductFormState>({
    name: '',
    category: '',
    subcategory: '',
    tags: [],
    originalPrice: '',
    discount: '0',
    rating: '0',
    reviews: '0',
    stock: '0',
    status: 'active',
    description: '',
    benefits: '',
    care: '',
    images: [],
    sizeVariants: [],
    potVariants: [],
  });

  const newImagePreviews = useMemo(() => {
    return newImageFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
  }, [newImageFiles]);

  useEffect(() => {
    return () => {
      newImagePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [newImagePreviews]);

  const availableSubcategories = useMemo(() => {
    return categories.find((cat) => cat._id === form.category)?.subcategories || [];
  }, [categories, form.category]);

  const loadData = async () => {
    if (!adminToken || !productId) return;

    try {
      setIsLoading(true);
      setError('');

      const [productRes, categoriesRes] = await Promise.all([
        fetch(buildApiUrl(`/api/products/${productId}`), { headers: getApiHeaders(adminToken) }),
        fetch(buildApiUrl('/api/categories'), { headers: getApiHeaders(adminToken) }),
      ]);

      const productPayload = await productRes.json();
      const categoriesPayload = await categoriesRes.json();

      if (!productRes.ok || !productPayload.success) {
        throw new Error(productPayload.error || productPayload.message || 'Failed to load product');
      }

      if (categoriesRes.ok && categoriesPayload.success) {
        setCategories(categoriesPayload.data || []);
      }

      const product = productPayload.data || {};

      setForm({
        name: product.name || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        tags: Array.isArray(product.tags)
          ? Array.from(new Set(product.tags.map((tag: string) => normalizeTag(tag)).filter(Boolean)))
          : (product.subcategory ? [normalizeTag(product.subcategory)] : []),
        originalPrice: String(product.originalPrice ?? ''),
        discount: String(product.discount ?? 0),
        rating: String(product.rating ?? 0),
        reviews: String(product.reviews ?? 0),
        stock: String(product.stock ?? 0),
        status: (product.status || 'active') as 'active' | 'inactive' | 'draft',
        description: product.description || '',
        benefits: Array.isArray(product.benefits) ? product.benefits.join('\n') : '',
        care: Array.isArray(product.care) ? product.care.join('\n') : '',
        images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
        sizeVariants: Array.isArray(product.sizeVariants)
          ? product.sizeVariants.map((v: any, idx: number) => ({
              id: idx + 1,
              name: v.name || '',
              price: String(v.price ?? ''),
              tag: v.tag || '',
            }))
          : [],
        potVariants: Array.isArray(product.potVariants)
          ? product.potVariants.map((v: any, idx: number) => ({
              id: idx + 1,
              name: v.name || '',
              price: String(v.price ?? ''),
              tag: v.tag || '',
            }))
          : [],
      });
      setNewImageFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [adminToken, productId]);

  const setField = (field: keyof ProductFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = (rawValue: string) => {
    const nextTag = normalizeTag(rawValue);
    if (!nextTag) return;

    setForm((prev) => {
      if (prev.tags.includes(nextTag)) return prev;
      return { ...prev, tags: [...prev.tags, nextTag] };
    });
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const updateVariant = (type: 'sizeVariants' | 'potVariants', index: number, field: keyof VariantForm, value: string) => {
    setForm((prev) => {
      const next = [...prev[type]];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, [type]: next };
    });
  };

  const addVariantRow = (type: 'sizeVariants' | 'potVariants') => {
    setForm((prev) => ({
      ...prev,
      [type]: [...prev[type], { id: prev[type].length + 1, name: '', price: '', tag: '' }],
    }));
  };

  const removeVariantRow = (type: 'sizeVariants' | 'potVariants', index: number) => {
    setForm((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, id: idx + 1 })),
    }));
  };

  const removeExistingImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const selectNewImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setNewImageFiles((prev) => [...prev, ...files]);
    event.target.value = '';
  };

  const handleSave = async () => {
    if (!adminToken || !productId) return;

    try {
      setIsSaving(true);
      setError('');
      setMessage('');

      const originalPrice = toNumber(form.originalPrice);
      const discount = toNumber(form.discount);
      const finalPrice = Math.max(0, Math.round(originalPrice - (originalPrice * discount) / 100));

      const uploadedUrls: string[] = [];
      for (const file of newImageFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');

        const uploadResponse = await fetch(buildApiUrl('/api/upload'), {
          method: 'POST',
          headers: {
            'X-Store-Name': getStoreForApi(adminToken),
            Authorization: `Bearer ${adminToken}`,
          },
          body: formData,
        });
        const uploadPayload = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadPayload.success || !uploadPayload.url) {
          throw new Error(uploadPayload.error || uploadPayload.message || `Failed to upload image: ${file.name}`);
        }

        uploadedUrls.push(uploadPayload.url);
      }

      const finalImages = [...form.images.map((img) => img.trim()).filter(Boolean), ...uploadedUrls];

      const payloadWithValues = {
        name: form.name.trim(),
        category: form.category,
        subcategory: normalizeTag(form.subcategory),
        tags: Array.from(new Set([
          normalizeTag(form.subcategory),
          ...form.tags.map((tag) => normalizeTag(tag)),
        ].filter(Boolean))),
        originalPrice,
        finalPrice,
        discount,
        rating: toNumber(form.rating),
        reviews: Math.max(0, Math.round(toNumber(form.reviews))),
        stock: Math.max(0, Math.round(toNumber(form.stock))),
        status: form.status,
        description: form.description.trim(),
        benefits: form.benefits
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        care: form.care
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
        images: finalImages,
        sizeVariants: form.sizeVariants
          .filter((v) => v.name.trim() && String(v.price).trim())
          .map((v, idx) => ({ id: idx + 1, name: v.name.trim(), price: toNumber(v.price), tag: v.tag?.trim() || undefined })),
        potVariants: form.potVariants
          .filter((v) => v.name.trim() && String(v.price).trim())
          .map((v, idx) => ({ id: idx + 1, name: v.name.trim(), price: toNumber(v.price), tag: v.tag?.trim() || undefined })),
      };

      if (!payloadWithValues.name || !payloadWithValues.category || !payloadWithValues.subcategory || payloadWithValues.images.length === 0) {
        throw new Error('Name, category, subcategory and at least one image are required');
      }

      const response = await fetch(buildApiUrl(`/api/products/${productId}`), {
        method: 'PUT',
        headers: getApiHeaders(adminToken),
        body: JSON.stringify(payloadWithValues),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Failed to update product');
      }

      setMessage('Product updated successfully.');
  setNewImageFiles([]);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-gray-600">Loading product details...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <Link href="/inventory?page=products" className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
            <FiArrowLeft /> Back to Products
          </Link>
          
          <p className="text-sm text-gray-600 mt-1">View and edit complete product information with image preview.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm hover:bg-black"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}
      {message && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{message}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Basic Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setField('name', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setField('status', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setField('category', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Subcategory</label>
              <select value={form.subcategory} onChange={(e) => setField('subcategory', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select subcategory</option>
                {availableSubcategories.map((sub) => (
                  <option key={sub.slug} value={sub.slug}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Tags (type and press Enter)</label>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                onBlur={() => addTag(tagInput)}
                placeholder="e.g. indoor-plants"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tags.length === 0 ? (
                  <span className="text-xs text-gray-500">No tags added yet.</span>
                ) : form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 text-xs text-gray-800 border border-gray-200">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-red-600 hover:text-red-700">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Original Price</label>
              <input type="number" value={form.originalPrice} onChange={(e) => setField('originalPrice', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Discount %</label>
              <input type="number" value={form.discount} onChange={(e) => setField('discount', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setField('stock', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Rating / Reviews</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="0.1" value={form.rating} onChange={(e) => setField('rating', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="number" value={form.reviews} onChange={(e) => setField('reviews', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Description</label>
            <textarea rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Benefits (one per line)</label>
              <textarea rows={5} value={form.benefits} onChange={(e) => setField('benefits', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Care (one per line)</label>
              <textarea rows={5} value={form.care} onChange={(e) => setField('care', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Images</h2>
              <label className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 cursor-pointer">
                <FiPlus size={14} /> Upload Images
                <input type="file" accept="image/*" multiple onChange={selectNewImages} className="hidden" />
              </label>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-500">Image URLs are hidden here. Manage images using upload and preview grid below.</p>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-600 mb-2">Preview (All Images)</p>
                <div className="overflow-x-auto">
                  <div className="flex gap-2 min-w-max pb-1">
                    {(() => {
                      const existingImages = form.images.filter(Boolean);
                      const pendingImages = newImagePreviews.map((item) => item.url);
                      const combinedImages = [...existingImages, ...pendingImages];

                      if (combinedImages.length === 0) {
                        return (
                          <div className="w-24 h-24 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                            <span className="text-[11px] text-gray-400">No Image</span>
                          </div>
                        );
                      }

                      return combinedImages.map((image, idx) => {
                        const isExisting = idx < existingImages.length;
                        const removeIndex = isExisting ? idx : idx - existingImages.length;

                        return (
                          <div key={`preview-${idx}`} className="relative w-24 h-24 shrink-0 rounded border border-gray-200 bg-gray-50 overflow-hidden">
                            <img src={image} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => (isExisting ? removeExistingImage(removeIndex) : removeNewImage(removeIndex))}
                              className="absolute top-1 right-1 p-1 rounded bg-white/90 border border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Size Variants</h2>
              <button type="button" onClick={() => addVariantRow('sizeVariants')} className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <FiPlus size={14} /> Add
              </button>
            </div>

            {form.sizeVariants.map((variant, idx) => (
              <div key={`size-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                <input value={variant.name} onChange={(e) => updateVariant('sizeVariants', idx, 'name', e.target.value)} placeholder="Name" className="col-span-5 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="number" value={variant.price} onChange={(e) => updateVariant('sizeVariants', idx, 'price', e.target.value)} placeholder="Price" className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input value={variant.tag || ''} onChange={(e) => updateVariant('sizeVariants', idx, 'tag', e.target.value)} placeholder="Tag" className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => removeVariantRow('sizeVariants', idx)} className="col-span-1 p-2 border border-red-300 rounded text-red-600 hover:bg-red-50">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Pot Variants</h2>
              <button type="button" onClick={() => addVariantRow('potVariants')} className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50">
                <FiPlus size={14} /> Add
              </button>
            </div>

            {form.potVariants.map((variant, idx) => (
              <div key={`pot-${idx}`} className="grid grid-cols-12 gap-2 items-center">
                <input value={variant.name} onChange={(e) => updateVariant('potVariants', idx, 'name', e.target.value)} placeholder="Name" className="col-span-5 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input type="number" value={variant.price} onChange={(e) => updateVariant('potVariants', idx, 'price', e.target.value)} placeholder="Price" className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <input value={variant.tag || ''} onChange={(e) => updateVariant('potVariants', idx, 'tag', e.target.value)} placeholder="Tag" className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={() => removeVariantRow('potVariants', idx)} className="col-span-1 p-2 border border-red-300 rounded text-red-600 hover:bg-red-50">
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
