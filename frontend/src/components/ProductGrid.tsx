'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiFilter, FiChevronDown } from 'react-icons/fi';
import ProductGridCard from './ProductGridCard';
import FilterPanel from './FilterPanel';

interface Product {
  _id: string;
  name: string;
  finalPrice: number;
  originalPrice: number;
  discount?: number;
  rating: number;
  reviews: number;
  images: string[];
  potVariants?: Array<{ id: number; name: string; price: number; tag?: string }>;
  sizeVariants?: Array<{ id: number; name: string; price: number; tag?: string }>;
  stock: number;
}

interface ProductGridProps {
  products: Product[];
  categoryName: string;
  onFilterChange?: (filters: any) => void;
}

type SortOption = 'featured' | 'best-selling' | 'name-asc' | 'name-desc' | 'price-low' | 'price-high' | 'newest' | 'rating';
type GridColumns = 2 | 3 | 4;

export default function ProductGrid({
  products,
  categoryName,
  onFilterChange
}: ProductGridProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [gridColumns, setGridColumns] = useState<GridColumns>(3);
  const [filters, setFilters] = useState({
    priceRange: [0, 10000] as [number, number],
    rating: 0,
    inStock: false
  });

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.finalPrice - b.finalPrice;
      case 'price-high':
        return b.finalPrice - a.finalPrice;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'rating':
        return b.rating - a.rating;
      case 'newest':
        return new Date(b._id).getTime() - new Date(a._id).getTime();
      default:
        return 0;
    }
  });

  // Filter products
  const filteredProducts = sortedProducts.filter((product) => {
    const inPriceRange = product.finalPrice >= filters.priceRange[0] && product.finalPrice <= filters.priceRange[1];
    const meetsRating = product.rating >= filters.rating;
    const inStock = !filters.inStock || product.stock > 0;

    return inPriceRange && meetsRating && inStock;
  });

  const gridColsClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className="w-full">
      {/* Filter Panel Modal */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={(newFilters: any) => {
          setFilters(newFilters);
          onFilterChange?.(newFilters);
        }}
      />

      {/* Controls Bar */}
      <div className="flex items-center gap-3 mb-6">
        {/* Filter Button */}
        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded text-sm font-montserrat font-normal text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <FiFilter size={16} className="text-gray-900" />
          FILTER
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="appearance-none px-3 py-2 border border-gray-300 rounded text-sm font-montserrat font-normal bg-white cursor-pointer text-gray-900 hover:bg-gray-50 transition-colors pr-8"
          >
            <option value="featured">Featured</option>
            <option value="best-selling">Best selling</option>
            <option value="name-asc">A-Z</option>
            <option value="name-desc">Z-A</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest</option>
            <option value="rating">Highest Rated</option>
          </select>
          <FiChevronDown
            size={16}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-900"
          />
        </div>

        {/* Grid View Toggle */}
        <div className="ml-auto flex items-center gap-1 bg-gray-100 p-1 rounded">
          <button
            onClick={() => setGridColumns(2)}
            className={`px-2 py-1.5 rounded text-sm transition-colors font-montserrat font-normal ${
              gridColumns === 2
                ? 'bg-white text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="2 columns"
          >
            2
          </button>
          <button
            onClick={() => setGridColumns(3)}
            className={`px-2 py-1.5 rounded text-sm transition-colors font-montserrat font-normal ${
              gridColumns === 3
                ? 'bg-white text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="3 columns"
          >
            3
          </button>
          <button
            onClick={() => setGridColumns(4)}
            className={`px-2 py-1.5 rounded text-sm transition-colors font-montserrat font-normal ${
              gridColumns === 4
                ? 'bg-white text-gray-900'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title="4 columns"
          >
            4
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <motion.div
          className={`grid ${gridColsClass[gridColumns]} gap-6 lg:gap-8`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: 0.15 + index * 0.05,
                ease: 'easeOut'
              }}
            >
              <ProductGridCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-600 font-montserrat">
            No products found. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
}
