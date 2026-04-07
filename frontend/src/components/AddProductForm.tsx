'use client';

import React, { useState } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

interface AddProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
}

export default function AddProductForm({ isOpen, onClose, onProductAdded }: AddProductFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subcategory: '',
    originalPrice: '',
    discount: '0',
    rating: '4.5',
    reviews: '0',
    description: '',
    status: 'active',
    images: ['', '', '', ''],
    sizeVariants: [
      { id: 1, name: '', price: '' },
      { id: 2, name: '', price: '' },
      { id: 3, name: '', price: '' }
    ],
    potVariants: [
      { id: 1, name: '', price: '' },
      { id: 2, name: '', price: '' },
      { id: 3, name: '', price: '' }
    ]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleSizeChange = (index: number, field: string, value: string) => {
    const newSizes = [...formData.sizeVariants];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormData(prev => ({ ...prev, sizeVariants: newSizes }));
  };

  const handlePotChange = (index: number, field: string, value: string) => {
    const newPots = [...formData.potVariants];
    newPots[index] = { ...newPots[index], [field]: value };
    setFormData(prev => ({ ...prev, potVariants: newPots }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Calculate final price
      const originalPrice = parseFloat(formData.originalPrice);
      const discount = parseFloat(formData.discount);
      const finalPrice = Math.round(originalPrice - (originalPrice * discount) / 100);

      // Filter out empty images
      const images = formData.images.filter(img => img.trim().length > 0);

      if (images.length === 0) {
        setError('At least one image URL is required');
        setIsLoading(false);
        return;
      }

      // Filter and validate variants
      const sizeVariants = formData.sizeVariants
        .filter(v => v.name && v.price)
        .map((v, idx) => ({
          id: idx + 1,
          name: v.name,
          price: parseFloat(v.price)
        }));

      const potVariants = formData.potVariants
        .filter(v => v.name && v.price)
        .map((v, idx) => ({
          id: idx + 1,
          name: v.name,
          price: parseFloat(v.price)
        }));

      const productData = {
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory,
        originalPrice: originalPrice,
        finalPrice: finalPrice,
        discount: discount > 0 ? discount : undefined,
        rating: parseFloat(formData.rating),
        reviews: parseInt(formData.reviews),
        description: formData.description || undefined,
        images,
        sizeVariants,
        potVariants,
        status: formData.status
      };

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add product');
      }

      setSuccess(true);
      if (onProductAdded) onProductAdded();
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        subcategory: '',
        originalPrice: '',
        discount: '0',
        rating: '4.5',
        reviews: '0',
        description: '',
        status: 'active',
        images: ['', '', '', ''],
        sizeVariants: [
          { id: 1, name: '', price: '' },
          { id: 2, name: '', price: '' },
          { id: 3, name: '', price: '' }
        ],
        potVariants: [
          { id: 1, name: '', price: '' },
          { id: 2, name: '', price: '' },
          { id: 3, name: '', price: '' }
        ]
      });

      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              ✅ Product added successfully!
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              ❌ {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="e.g., Monstera Plant"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="e.g., Plants"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
              <input
                type="text"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="e.g., Indoor Plants"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Original Price *</label>
              <input
                type="number"
                name="originalPrice"
                value={formData.originalPrice}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <input
                type="number"
                name="rating"
                value={formData.rating}
                onChange={handleChange}
                min="0"
                max="5"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="4.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reviews</label>
              <input
                type="number"
                name="reviews"
                value={formData.reviews}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              placeholder="Product description..."
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Image URLs (AWS S3) *</label>
            <div className="space-y-2">
              {formData.images.map((img, idx) => (
                <input
                  key={idx}
                  type="url"
                  value={img}
                  onChange={(e) => handleImageChange(idx, e.target.value)}
                  placeholder={`Image URL ${idx + 1}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                />
              ))}
            </div>
          </div>

          {/* Size & Pot Variants - Single Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Size Variants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Size Variants</label>
              <div className="space-y-2">
                {formData.sizeVariants.map((size, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={size.name}
                      onChange={(e) => handleSizeChange(idx, 'name', e.target.value)}
                      placeholder="Name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                    />
                    <input
                      type="number"
                      value={size.price}
                      onChange={(e) => handleSizeChange(idx, 'price', e.target.value)}
                      placeholder="Price"
                      min="0"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pot Variants */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pot Variants</label>
              <div className="space-y-2">
                {formData.potVariants.map((pot, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={pot.name}
                      onChange={(e) => handlePotChange(idx, 'name', e.target.value)}
                      placeholder="Name"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                    />
                    <input
                      type="number"
                      value={pot.price}
                      onChange={(e) => handlePotChange(idx, 'price', e.target.value)}
                      placeholder="Price"
                      min="0"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg text-white font-medium transition flex items-center gap-2 ${
                isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isLoading ? 'Adding...' : <><FiPlus size={18} /> Add Product</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
