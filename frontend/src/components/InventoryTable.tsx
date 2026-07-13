'use client';

import React, { useState, useEffect } from 'react';
import { fetchWithStore } from '@/lib/storeConfig';
import { useAuth } from '@/contexts/AuthContext';
import { FiSearch, FiSave, FiPlus, FiMinus } from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  stock: number;
  costPrice: number;
  images: string[];
}

export const InventoryTable: React.FC = () => {
  const { admin } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    total: 0
  });

  // Keep track of edited values
  const [stockEdits, setStockEdits] = useState<Record<string, number | string>>({});
  const [costPriceEdits, setCostPriceEdits] = useState<Record<string, number | string>>({});
  const [isSaving, setIsSaving] = useState<string | null>(null);

  // KPIs state
  const [dashboardStats, setDashboardStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    lowStock: 0,
    totalValue: 0,
    retailValue: 0,
    stockUnits: 0
  });

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [pagination.currentPage, pagination.pageSize, stockStatusFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearchQuery);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  const fetchStats = async () => {
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || undefined : undefined;
      const response = await fetchWithStore('/api/inventory/stats', { token: adminToken });
      
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setDashboardStats({
            totalProducts: json.data.totalProducts || 0,
            totalCategories: json.data.totalCategories || 0, // Mocked or fetched elsewhere
            lowStock: json.data.lowStockCount || 0,
            totalValue: json.data.inventoryValue || 0,
            retailValue: json.data.stockValue || 0,
            stockUnits: json.data.stockUnits || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || undefined : undefined;
      let url = `/api/products?limit=${pagination.pageSize}&skip=${(pagination.currentPage - 1) * pagination.pageSize}`;
      
      if (stockStatusFilter) {
        url += `&stockStatus=${stockStatusFilter}`;
      }

      if (searchQuery && searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const response = await fetchWithStore(url, { token: adminToken });
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      const total = Number(data?.pagination?.total || 0);
      const totalPages = Math.max(1, Math.ceil(total / pagination.pageSize));

      if (pagination.currentPage > totalPages) {
        setPagination((prev) => ({
          ...prev,
          currentPage: 1,
          total,
          totalPages,
        }));
        setProducts([]);
        return;
      }

      setProducts(data.data || []);
      setPagination(prev => ({
        ...prev,
        total,
        totalPages
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStockChange = (productId: string, newValue: string) => {
    if (newValue === '') {
      setStockEdits(prev => ({ ...prev, [productId]: '' }));
      return;
    }
    const parsed = parseInt(newValue, 10);
    if (isNaN(parsed)) return;

    setStockEdits(prev => ({ ...prev, [productId]: parsed }));
  };

  const handleCostPriceChange = (productId: string, newValue: string) => {
    if (newValue === '') {
      setCostPriceEdits(prev => ({ ...prev, [productId]: '' }));
      return;
    }
    const parsed = parseFloat(newValue);
    if (isNaN(parsed)) return;

    setCostPriceEdits(prev => ({ ...prev, [productId]: parsed }));
  };

  const handleSave = async (productId: string) => {
    const product = products.find(p => p._id === productId);
    
    const rawStock = stockEdits[productId];
    const rawCostPrice = costPriceEdits[productId];
    
    const newStock = rawStock !== undefined ? (rawStock === '' ? 0 : Number(rawStock)) : product?.stock;
    const newCostPrice = rawCostPrice !== undefined ? (rawCostPrice === '' ? 0 : Number(rawCostPrice)) : product?.costPrice;
    
    if (!product || (product.stock === newStock && product.costPrice === newCostPrice)) return;

    
    setIsSaving(productId);
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') || undefined : undefined;
      const response = await fetchWithStore(`/api/products/${productId}`, {
        method: 'PUT',
        token: adminToken,
        body: JSON.stringify({ stock: newStock, costPrice: newCostPrice })
      });

      if (!response.ok) throw new Error('Failed to update product');

      // Update local state
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: newStock!, costPrice: newCostPrice! } : p));
      
      // Clear edit
      setStockEdits(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setCostPriceEdits(prev => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      
      // Refresh stats
      fetchStats();

    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    } finally {
      setIsSaving(null);
    }
  };

  const filteredProducts = products;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Total Products</span>
          <span className="text-2xl font-bold text-gray-900">{dashboardStats.totalProducts}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Low Stock Alerts</span>
          <span className="text-2xl font-bold text-red-600">{dashboardStats.lowStock}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Stock Units</span>
          <span className="text-2xl font-bold text-gray-900">{dashboardStats.stockUnits.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Cost Value</span>
          <span className="text-2xl font-bold text-blue-600">₹{dashboardStats.totalValue.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col">
          <span className="text-sm font-medium text-gray-500 mb-1">Retail Value</span>
          <span className="text-2xl font-bold text-green-600">₹{dashboardStats.retailValue.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:w-64">
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">All Stock Status</option>
                <option value="in-stock">In Stock (&gt;0)</option>
                <option value="low-stock">Low Stock (&lt;100)</option>
                <option value="out-of-stock">Out of Stock (0)</option>
              </select>
            </div>
          </div>
        </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cost Price</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Inventory Value</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Current Stock</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Adjust Inventory</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading inventory...</td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No products found</td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const newStock = stockEdits[product._id] !== undefined ? stockEdits[product._id] : product.stock;
                const newCostPrice = costPriceEdits[product._id] !== undefined ? costPriceEdits[product._id] : (product.costPrice || 0);
                const hasChanged = newStock !== product.stock || newCostPrice !== (product.costPrice || 0);

                return (
                  <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">{product._id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        )}
                        <span className="font-medium text-gray-900 truncate">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-500">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={newCostPrice}
                          onChange={(e) => handleCostPriceChange(product._id, e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ₹{(Number(newCostPrice) * Number(newStock)).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.stock > 100 ? 'bg-green-100 text-green-800' : product.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="0"
                          value={newStock}
                          onChange={(e) => handleStockChange(product._id, e.target.value)}
                          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                        />
                        
                        {hasChanged && (
                          <button
                            onClick={() => handleSave(product._id)}
                            disabled={isSaving === product._id || Number(newStock) < 0 || Number(newCostPrice) < 0}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition ${Number(newStock) < 0 || Number(newCostPrice) < 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                          >
                            {isSaving === product._id ? 'Saving...' : <><FiSave size={14} /> Save</>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">
            Showing page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}
          </p>
          <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => setPagination(prev => ({ ...prev, pageSize: Number(e.target.value), currentPage: 1 }))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-green-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {pagination.totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.max(1, prev.currentPage - 1) }))}
              disabled={pagination.currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, currentPage: Math.min(prev.totalPages, prev.currentPage + 1) }))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default InventoryTable;
