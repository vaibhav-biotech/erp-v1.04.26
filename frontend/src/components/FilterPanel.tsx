'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    priceRange: [number, number];
    rating: number;
    inStock: boolean;
  };
  onFiltersChange: (filters: any) => void;
}

export default function FilterPanel({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}: FilterPanelProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters = {
      priceRange: [0, 1000] as [number, number],
      rating: 0,
      inStock: false
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - Light/Transparent */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-white/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Panel - Centered */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-h-[80vh] bg-white shadow-xl rounded-lg z-50 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-montserrat font-normal text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Filters Content */}
        <div className="flex-1 px-6 py-6 space-y-8">
          {/* Price Range Filter */}
          <div>
            <h3 className="text-sm font-montserrat font-normal text-gray-900 uppercase mb-4">
              Price
            </h3>
            <div className="space-y-4">
              {/* Min Price */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 font-montserrat">
                  Min: ₹{localFilters.priceRange[0]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={localFilters.priceRange[0]}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      priceRange: [parseInt(e.target.value), prev.priceRange[1]]
                    }))
                  }
                  className="w-full h-1 bg-gray-300 rounded appearance-none cursor-pointer accent-green-600"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-xs text-gray-600 mb-2 font-montserrat">
                  Max: ₹{localFilters.priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={localFilters.priceRange[1]}
                  onChange={(e) =>
                    setLocalFilters((prev) => ({
                      ...prev,
                      priceRange: [prev.priceRange[0], parseInt(e.target.value)]
                    }))
                  }
                  className="w-full h-1 bg-gray-300 rounded appearance-none cursor-pointer accent-green-600"
                />
              </div>
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <h3 className="text-sm font-montserrat font-normal text-gray-900 uppercase mb-4">
              Rating
            </h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <label key={rating} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.rating >= rating}
                    onChange={() =>
                      setLocalFilters((prev) => ({
                        ...prev,
                        rating: prev.rating === rating ? 0 : rating
                      }))
                    }
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-green-600"
                  />
                  <span className="flex items-center gap-1">
                    {[...Array(rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">
                        ★
                      </span>
                    ))}
                    {[...Array(5 - rating)].map((_, i) => (
                      <span key={i} className="text-gray-300 text-sm">
                        ★
                      </span>
                    ))}
                  </span>
                  <span className="text-xs text-gray-600 font-montserrat">
                    {rating} stars & up
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div>
            <h3 className="text-sm font-montserrat font-normal text-gray-900 uppercase mb-4">
              Availability
            </h3>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.inStock}
                onChange={(e) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    inStock: e.target.checked
                  }))
                }
                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-green-600"
              />
              <span className="text-sm text-gray-900 font-montserrat">
                In Stock Only
              </span>
            </label>
          </div>
        </div>

        {/* Footer - Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 space-y-3">
          <button
            onClick={handleApply}
            className="w-full bg-black text-white py-2 rounded text-sm font-montserrat font-normal hover:bg-gray-900 transition-colors"
          >
            APPLY
          </button>
          <button
            onClick={handleClear}
            className="w-full bg-gray-100 text-gray-900 py-2 rounded text-sm font-montserrat font-normal hover:bg-gray-200 transition-colors"
          >
            CLEAR
          </button>
        </div>
      </motion.div>
    </>
  );
}
