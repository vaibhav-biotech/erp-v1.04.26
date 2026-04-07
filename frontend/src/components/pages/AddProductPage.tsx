'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import { useCategories } from '@/hooks/useCategories';

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories: { name: string; slug: string }[];
}

export default function AddProductPage() {
  const router = useRouter();
  const { fetchCategories } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<{ name: string; slug: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

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
    
    // When category changes, update subcategories list and reset subcategory
    if (name === 'category') {
      const selectedCategory = categories.find(cat => cat._id === value);
      if (selectedCategory) {
        setSelectedSubcategories(selectedCategory.subcategories);
      } else {
        setSelectedSubcategories([]);
      }
      setFormData(prev => ({ 
        ...prev, 
        [name]: value,
        subcategory: '' // Reset subcategory when category changes
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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
      const originalPrice = parseFloat(formData.originalPrice);
      const discount = parseFloat(formData.discount);
      const finalPrice = Math.round(originalPrice - (originalPrice * discount) / 100);

      const images = formData.images.filter(img => img.trim().length > 0);

      if (images.length === 0) {
        setError('At least one image URL is required');
        setIsLoading(false);
        return;
      }

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
      setTimeout(() => {
        router.push('/dashboard?page=products');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard?page=products')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
        >
          <FiArrowLeft size={18} />
          Back
        </button>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-1">Fill in all details to add a new product</p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <span>✅</span>
              <span>Product added successfully! Redirecting...</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <span>❌</span>
              <span>{error}</span>
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
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={categoriesLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 disabled:bg-gray-100"
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subcategory *</label>
              <select
                name="subcategory"
                value={formData.subcategory}
                onChange={handleChange}
                required
                disabled={!formData.category || selectedSubcategories.length === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 disabled:bg-gray-100"
              >
                <option value="">
                  {selectedSubcategories.length === 0 ? 'Select a category first' : 'Select a subcategory'}
                </option>
                {selectedSubcategories.map(subcat => (
                  <option key={subcat.slug} value={subcat.slug}>
                    {subcat.name}
                  </option>
                ))}
              </select>
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
          <div className="flex gap-3 justify-end pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push('/dashboard?page=products')}
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
