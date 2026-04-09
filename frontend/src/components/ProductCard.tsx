'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiShoppingCart, FiHeart } from 'react-icons/fi';

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
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const discount = product.discount || Math.round(((product.originalPrice - product.finalPrice) / product.originalPrice) * 100);
  const mainImage = product.images?.[0] || '';

  return (
    <Link href={`/products/${product._id}`}>
      <div className="group cursor-pointer">
        {/* Image Container */}
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square mb-4 flex items-center justify-center">
          {/* Image */}
          {mainImage && (
            <img
              src={mainImage}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse" />
          )}

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
              -{discount}%
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <FiHeart
              size={16}
              className={isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}
            />
          </button>

          {/* Add to Cart on Hover */}
          <button
            onClick={(e) => {
              e.preventDefault();
              console.log('Add to cart:', product._id);
            }}
            className="absolute bottom-0 left-0 right-0 bg-black text-white py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
          >
            <FiShoppingCart size={16} />
            ADD TO CART
          </button>
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          {/* Title */}
          <h3 className="text-sm font-montserrat font-normal text-gray-900 line-clamp-2 group-hover:text-green-600 transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-montserrat font-normal text-gray-900">
              €{product.finalPrice.toFixed(2)}
            </span>
            {product.originalPrice > product.finalPrice && (
              <span className="text-xs font-montserrat text-gray-500 line-through">
                €{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviews})</span>
          </div>

          {/* Variant Dots */}
          {product.potVariants && product.potVariants.length > 0 && (
            <div className="flex gap-2 pt-1">
              {product.potVariants.slice(0, 3).map((variant) => (
                <div
                  key={variant.id}
                  className="w-2.5 h-2.5 rounded-full bg-gray-300 border border-gray-400"
                  title={variant.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
