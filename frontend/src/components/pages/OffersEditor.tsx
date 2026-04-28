'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiTrash2, FiEdit2, FiArrowUp, FiArrowDown, FiUpload } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders, getStoreForApi } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';

const SLOT_LABELS = [
  { label: '250×250', desc: 'Small Square — Top Left', color: 'bg-blue-100 text-blue-700' },
  { label: '250×250', desc: 'Small Square — Top Right', color: 'bg-blue-100 text-blue-700' },
  { label: '500×250', desc: 'Wide Rectangle — Bottom Left', color: 'bg-purple-100 text-purple-700' },
  { label: '600×600', desc: 'Big Square — Right Column', color: 'bg-green-100 text-green-700' },
];

function getSlot(index: number) {
  return SLOT_LABELS[index] ?? { label: `Slot ${index + 1}`, desc: 'Extra offer (not shown in grid)', color: 'bg-gray-100 text-gray-500' };
}

interface Offer {
  _id: string;
  title: string;
  description?: string;
  offerPercent: number;
  bannerImage: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
}

interface OfferForm {
  title: string;
  description: string;
  offerPercent: string;
  bannerImage: string;
  buttonText: string;
  buttonLink: string;
}

export default function OffersEditor() {
  const { adminToken } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState<OfferForm>({
    title: '',
    description: '',
    offerPercent: '',
    bannerImage: '',
    buttonText: 'Shop Now',
    buttonLink: '/products',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load offers on mount
  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(buildApiUrl('/api/landing/offers'), {
        headers: getApiHeaders(),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setOffers((data.data || []).sort((a: Offer, b: Offer) => a.displayOrder - b.displayOrder));
      }
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageFileChange = (file: File) => {
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSaveOffer = async () => {
    if (!form.title.trim() || !form.offerPercent) {
      alert('Title and Offer % are required');
      return;
    }

    setIsSaving(true);
    try {
      let finalImageUrl = form.bannerImage;

      // Upload file to S3 if a new file was selected
      if (imageFile) {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageFile);
        uploadFormData.append('folder', 'offer-banners');
        const uploadRes = await fetch(buildApiUrl('/api/upload'), {
          method: 'POST',
          headers: {
            'X-Store-Name': getStoreForApi(adminToken || undefined),
            ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
          },
          body: uploadFormData,
        });
        const uploadPayload = await uploadRes.json();
        setIsUploading(false);
        if (!uploadRes.ok || !uploadPayload.success || !uploadPayload.url) {
          throw new Error(uploadPayload.error || 'Image upload failed');
        }
        finalImageUrl = uploadPayload.url;
      }

      const endpoint = editingId
        ? `/api/landing/offers/${editingId}`
        : '/api/landing/offers';

      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(buildApiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(),
          'X-Store-Name': getStoreForApi(adminToken || undefined),
          ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          offerPercent: Number(form.offerPercent),
          bannerImage: finalImageUrl,
          buttonText: form.buttonText,
          buttonLink: form.buttonLink,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save offer');
      }

      await fetchOffers();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error('Error saving offer:', error);
      alert('Failed to save offer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm('Delete this offer?')) return;

    try {
      const response = await fetch(buildApiUrl(`/api/landing/offers/${offerId}`), {
        method: 'DELETE',
        headers: {
          ...getApiHeaders(),
          'X-Store-Name': getStoreForApi(adminToken || undefined),
          ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete offer');
      }

      await fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      alert('Failed to delete offer');
    }
  };

  const handleReorderOffer = async (offerId: string, direction: 'up' | 'down') => {
    const currentIndex = offers.findIndex(o => o._id === offerId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === offers.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newOffers = [...offers];
    [newOffers[currentIndex], newOffers[newIndex]] = [newOffers[newIndex], newOffers[currentIndex]];

    // Update display order
    try {
      await Promise.all(
        newOffers.map((offer, idx) =>
          fetch(buildApiUrl(`/api/landing/offers/${offer._id}`), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...getApiHeaders(),
              'X-Store-Name': getStoreForApi(adminToken || undefined),
              ...(adminToken && { Authorization: `Bearer ${adminToken}` }),
            },
            body: JSON.stringify({ ...offer, displayOrder: idx }),
          })
        )
      );
      await fetchOffers();
    } catch (error) {
      console.error('Error reordering offers:', error);
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setForm({
      title: offer.title,
      description: offer.description || '',
      offerPercent: String(offer.offerPercent),
      bannerImage: offer.bannerImage,
      buttonText: offer.buttonText || 'Shop Now',
      buttonLink: offer.buttonLink || '/products',
    });
    setEditingId(offer._id);
    setImageFile(null);
    setImagePreview(offer.bannerImage || '');
    setShowForm(true);
  };

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      offerPercent: '',
      bannerImage: '',
      buttonText: 'Shop Now',
      buttonLink: '/products',
    });
    setEditingId(null);
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-montserrat font-bold text-lg text-black">Offers Grid Section</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-montserrat text-sm hover:bg-gray-900 transition"
        >
          <FiPlus size={16} />
          {showForm ? 'Cancel' : 'Add Offer'}
        </button>
      </div>

      {/* Form - Add/Edit Offer */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-montserrat text-gray-700 mb-2">Offer Title *</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleFormChange}
                placeholder="e.g. A Living Gift"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-montserrat text-gray-700 mb-2">Offer % *</label>
              <input
                type="number"
                name="offerPercent"
                value={form.offerPercent}
                onChange={handleFormChange}
                placeholder="e.g. 30"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-montserrat text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleFormChange}
              placeholder="Optional description for the offer"
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
            />
          </div>

          {/* Grid Slot Info */}
          {(() => {
            const slotIndex = editingId
              ? offers.findIndex(o => o._id === editingId)
              : offers.length;
            const slot = getSlot(slotIndex);
            return (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${slot.color}`}>
                <span>Grid Slot: {slot.label}</span>
                <span className="opacity-70">— {slot.desc}</span>
              </div>
            );
          })()}

          {/* Banner Image Upload */}
          <div>
            <label className="block text-sm font-montserrat text-gray-700 mb-2">Banner Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFileChange(file);
              }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageFileChange(file);
              }}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-black transition"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded object-contain" />
              ) : (
                <>
                  <FiUpload size={24} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Click or drag & drop image here</span>
                </>
              )}
            </div>
            {imagePreview && (
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(''); setForm(prev => ({ ...prev, bannerImage: '' })); }}
                className="mt-1 text-xs text-red-500 hover:underline"
              >
                Remove image
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-montserrat text-gray-700 mb-2">Button Text</label>
              <input
                type="text"
                name="buttonText"
                value={form.buttonText}
                onChange={handleFormChange}
                placeholder="Shop Now"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-montserrat text-gray-700 mb-2">Button Link</label>
              <input
                type="text"
                name="buttonLink"
                value={form.buttonLink}
                onChange={handleFormChange}
                placeholder="/products"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>

          <button
            onClick={handleSaveOffer}
            disabled={isSaving || isUploading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-montserrat font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
          >
            {isUploading ? 'Uploading image...' : isSaving ? 'Saving...' : editingId ? 'Update Offer' : 'Create Offer'}
          </button>
        </motion.div>
      )}

      {/* Offers List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No offers yet. Create one to get started.</div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer, idx) => (
            <div key={offer._id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {/* Thumbnail */}
              {offer.bannerImage && (
                <img src={offer.bannerImage} alt={offer.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-montserrat font-bold text-gray-900">{offer.title}</h3>
                <p className="text-xs text-gray-600 mb-1">{offer.offerPercent}% OFF</p>
                {(() => {
                  const slot = getSlot(idx);
                  return (
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-semibold ${slot.color}`}>
                      {slot.label} — {slot.desc}
                    </span>
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReorderOffer(offer._id, 'up')}
                  disabled={idx === 0}
                  className="p-2 hover:bg-gray-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiArrowUp size={16} />
                </button>

                <button
                  onClick={() => handleReorderOffer(offer._id, 'down')}
                  disabled={idx === offers.length - 1}
                  className="p-2 hover:bg-gray-200 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiArrowDown size={16} />
                </button>

                <button
                  onClick={() => handleEditOffer(offer)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                >
                  <FiEdit2 size={16} />
                </button>

                <button
                  onClick={() => handleDeleteOffer(offer._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
