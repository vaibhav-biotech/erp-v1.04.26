'use client';

import React, { useState, useEffect } from 'react';
import {
  FiEdit2,
  FiTrash2,
  FiChevronUp,
  FiChevronDown,
  FiSearch,
  FiFilter
} from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  category: string;
  subcategory: string;
  originalPrice: number;
  finalPrice: number;
  rating: number;
  reviews: number;
  images: string[];
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
}

interface ProductsTableProps {
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onRefresh?: () => void;
}

type SortField = 'name' | 'category' | 'finalPrice' | 'rating' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export const ProductsTable: React.FC<ProductsTableProps> = ({
  onEdit,
  onDelete,
  onRefresh
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'draft'>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    total: 0
  });

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage, filterStatus]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      let url = `/api/products?limit=${pagination.pageSize}&skip=${(pagination.currentPage - 1) * pagination.pageSize}`;

      if (filterStatus !== 'all') {
        url += `&status=${filterStatus}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      setProducts(data.data);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: Math.ceil(data.pagination.total / pagination.pageSize)
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setProducts(data.data);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');

      setProducts(products.filter(p => p._id !== productId));
      if (onDelete) onDelete(productId);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle dates
    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with Search & Filter */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Products</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="flex gap-2 md:col-span-2">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Search
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <FiFilter size={18} className="text-gray-600" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-green-600 transition"
                >
                  Product Name {getSortIcon('name')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Category
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('finalPrice')}
                  className="flex items-center gap-2 hover:text-green-600 transition"
                >
                  Price {getSortIcon('finalPrice')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                <button
                  onClick={() => handleSort('rating')}
                  className="flex items-center gap-2 hover:text-green-600 transition"
                >
                  Rating {getSortIcon('rating')}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Loading products...
                </td>
              </tr>
            ) : sortedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No products found
                </td>
              </tr>
            ) : (
              sortedProducts.map((product) => (
                <tr key={product._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                      )}
                      <span className="font-medium text-gray-900 truncate">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{product.finalPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-yellow-600">⭐ {product.rating}</span>
                    <span className="text-gray-600 ml-1">({product.reviews})</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit?.(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.total} total)
          </p>
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
        </div>
      )}
    </div>
  );
};

export default ProductsTable;
