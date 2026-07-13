'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiCheck } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  images: { url: string }[];
  status: string;
}

interface DynamicSection {
  _id: string;
  title: string;
  isActive: boolean;
  displayOrder: number;
  productIds: Product[];
}

interface Category {
  _id: string;
  name: string;
}

export default function DynamicSectionsManager() {
  const { adminToken } = useAuth();
  const [sections, setSections] = useState<DynamicSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Category State
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (adminToken) {
      fetchSections();
      fetchCategories();
    }
  }, [adminToken]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(buildApiUrl('/api/categories'), {
        headers: getApiHeaders(adminToken || undefined)
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(buildApiUrl('/api/landing/admin/dynamic-sections'), {
        headers: getApiHeaders(adminToken || undefined)
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching dynamic sections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(''); // Reset category when searching text
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    try {
      setIsSearching(true);
      const res = await fetch(buildApiUrl(`/api/products/search?q=${encodeURIComponent(query)}`), {
        headers: getApiHeaders(adminToken || undefined)
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.products || []);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Reset text search when category selected
    
    if (!categoryId) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(buildApiUrl(`/api/products?category=${categoryId}&limit=50`), {
        headers: getApiHeaders(adminToken || undefined)
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.data || []);
        setShowDropdown(true);
      }
    } catch (err) {
      console.error('Category products fetch error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleProduct = (product: Product) => {
    const isSelected = selectedProducts.find(p => p._id === product._id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(p => p._id !== product._id));
    } else {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p._id !== productId));
  };

  const handleEdit = (section: DynamicSection) => {
    setEditingId(section._id);
    setTitle(section.title);
    setDisplayOrder(section.displayOrder);
    setIsActive(section.isActive);
    setSelectedProducts(section.productIds || []);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setDisplayOrder(0);
    setIsActive(true);
    setSelectedProducts([]);
    setSearchQuery('');
    setSelectedCategory('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title for the section');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const payload = {
        title,
        displayOrder,
        isActive,
        productIds: selectedProducts.map(p => p._id)
      };

      const url = editingId 
        ? buildApiUrl(`/api/landing/admin/dynamic-sections/${editingId}`)
        : buildApiUrl('/api/landing/admin/dynamic-sections');
        
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getApiHeaders(adminToken || undefined),
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save section');

      await fetchSections();
      handleCancel();
    } catch (err) {
      console.error('Error saving dynamic section:', err);
      alert('Failed to save section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    
    try {
      const res = await fetch(buildApiUrl(`/api/landing/admin/dynamic-sections/${id}`), {
        method: 'DELETE',
        headers: getApiHeaders(adminToken || undefined)
      });

      if (!res.ok) throw new Error('Failed to delete section');
      
      await fetchSections();
      if (editingId === id) handleCancel();
    } catch (err) {
      console.error('Error deleting section:', err);
      alert('Failed to delete section');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading dynamic sections...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {editingId ? 'Edit Collection Section' : 'Create New Collection Section'}
        </h2>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                placeholder="e.g. New Arrivals"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
              />
              <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Section is Active</span>
            </label>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-md font-medium text-gray-900 mb-4">Select Products</h3>
            
            <div className="relative" ref={dropdownRef}>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search products by name or SKU..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                {isSearching && searchQuery && (
                  <div className="absolute right-3 top-2.5 text-gray-400 text-sm">Searching...</div>
                )}
              </div>
              
              <div className="relative flex-1">
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none appearance-none bg-white"
                >
                  <option value="">Filter by Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
                {isSearching && selectedCategory && (
                  <div className="absolute right-8 top-2.5 text-gray-400 text-sm">Loading...</div>
                )}
              </div>
            </div>

            <div className="relative mb-6">
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map(product => {
                    const isSelected = selectedProducts.some(p => p._id === product._id);
                    return (
                    <div 
                      key={product._id}
                      onClick={() => toggleProduct(product)}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                    >
                      <div className="w-10 h-10 relative bg-gray-100 rounded overflow-hidden flex-shrink-0">
                        {product.images?.[0]?.url && (
                          <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.sku}</p>
                      </div>
                      <div className="text-gray-400">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-white">
                            <FiCheck size={14} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                )}
              </div>
            </div>

            {selectedProducts.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Products ({selectedProducts.length})</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedProducts.map(product => (
                    <div key={product._id} className="relative bg-gray-50 rounded-lg p-3 pr-8 border border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate" title={product.name}>{product.name}</p>
                      <button
                        type="button"
                        onClick={() => removeProduct(product._id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 p-1"
                      >
                        <FiX size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            {editingId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
            >
              <FiSave size={18} />
              {isSaving ? 'Saving...' : (editingId ? 'Update Section' : 'Create Section')}
            </button>
          </div>
        </form>
      </div>

      {sections.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Existing Sections</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {sections.map(section => (
              <div key={section._id} className="p-6 flex items-start justify-between hover:bg-gray-50 transition">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-gray-900">{section.title}</h3>
                    {section.isActive ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-2">Order: {section.displayOrder} • {section.productIds?.length || 0} products</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(section)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit"
                  >
                    <FiEdit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(section._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
