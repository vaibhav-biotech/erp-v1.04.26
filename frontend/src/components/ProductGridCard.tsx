'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiHeart } from 'react-icons/fi';
import Button from './Button';

interface Product {
  _id: string;
  name: string;
  finalPrice: number;
  originalPrice: number;
  discount?: number;
  rating: number;
  reviews: number;
  images: string[];
  benefits?: string[];
}

interface ProductGridCardProps {
  product: Product;
}

export default function ProductGridCard({ product }: ProductGridCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const discount = product.discount || Math.round(((product.originalPrice - product.finalPrice) / product.originalPrice) * 100);
  const mainImage = product.images?.[0] || '';

  // Extract first 2 benefits as tags
  const tags = product.benefits?.slice(0, 2).map((benefit: string) => {
    // Clean up benefit text
    return benefit.replace(/["\n]/g, '').split(':')[0].trim();
  }) || [];

  return (
    <div className="flex flex-col h-full">
        {/* Image Container */}
      <Link href={`/product/${product._id}`} className="block mb-3">
        <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square flex items-center justify-center group">
          {/* Image */}
          {mainImage && (
            <img
              src={mainImage}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
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
            <div className="absolute top-3 left-3 bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold font-montserrat">
              {discount}% OFF
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
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col space-y-2">
        {/* Title */}
        <Link href={`/products/${product._id}`}>
          <h3 className="text-sm font-montserrat font-normal text-gray-900 line-clamp-2 hover:text-green-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Tags/Badges */}
        {tags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs font-montserrat font-normal px-2.5 py-1 rounded-full bg-green-100 text-green-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Rating + Reviews */}
        <div className="flex items-center gap-1 text-xs font-montserrat">
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
          <span className="text-gray-900 font-normal">{product.rating}</span>
          <span className="text-gray-500">({product.reviews})</span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 py-1">
          <span className="text-base font-montserrat font-normal text-gray-900">
            ₹{product.finalPrice.toFixed(2)}
          </span>
          {product.originalPrice > product.finalPrice && (
            <span className="text-xs font-montserrat text-gray-500 line-through">
              ₹{product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Buy Now Button */}
        <Link href={`/products/${product._id}`} className="mt-auto">
          <Button
            variant="success"
            size="md"
            fullWidth
          >
            BUY NOW
          </Button>
        </Link>
      </div>
    </div>
  );
}
