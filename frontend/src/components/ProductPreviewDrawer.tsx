'use client';

import { FiX, FiHeart, FiCheck } from 'react-icons/fi';
import Button from '@/components/Button';

interface ProductPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product?: {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    discount: number;
    rating: number;
    reviews: number;
    image: string;
    inStock: boolean;
    description: string;
  };
}

export default function ProductPreviewDrawer({
  isOpen,
  onClose,
  product,
}: ProductPreviewDrawerProps) {
  if (!isOpen || !product) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-50 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Quick Preview</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          {/* Product Image */}
          <div className="rounded-lg overflow-hidden w-full aspect-square bg-gray-100">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Name & Rating */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-black">{product.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500">★★★★☆</span>
              <span className="text-sm text-gray-600">{product.rating}</span>
              <span className="text-xs text-gray-500">({product.reviews})</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-1 p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">
                ₹{product.price}
              </span>
              <span className="text-sm text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            </div>
            <span className="text-red-600 text-xs font-semibold">
              {product.discount}% OFF
            </span>
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg">
            <FiCheck className="text-gray-600 w-4 h-4" />
            <span className="text-sm text-gray-900 font-medium">
              {product.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <p className="text-sm text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 space-y-3 bg-white sticky bottom-0">
          <Button variant="primary" fullWidth>
            View Details
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth>
              Add to Cart
            </Button>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex-shrink-0">
              <FiHeart className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
