'use client';

import { useState } from 'react';
import ProductGallery from '@/components/ProductGallery';
import VariantCard from '@/components/VariantCard';
import Breadcrumb from '@/components/Breadcrumb';
import { ProductInfo } from '@/components/productinfo';
import { DeliveryChecker } from '@/components/deliveryChecker';
import { GiftOptions } from '@/components/GiftOptions';
import ActionButtons from '@/components/ActionButtons';
import ProductDetails from '@/components/ProductDetails';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Variant {
  id: number;
  name: string;
  price: number;
  tag?: string;
}

interface ProductDetailCardProps {
  product: {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    rating: number;
    reviews: number;
    originalPrice: number;
    finalPrice: number;
    discount: number;
    description?: string;
    benefits?: string[];
    care?: string[];
  };
  breadcrumbs?: BreadcrumbItem[];
  sizeVariants?: Variant[];
  potVariants?: Variant[];
  onAddToCart?: (quantity: number, size: number, pot: number, isGift: boolean) => void;
  onBuyNow?: (quantity: number, size: number, pot: number, isGift: boolean) => void;
}

export default function ProductDetailCard({
  product,
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Plants', href: '/products' },
    { label: 'Indoor Plants', href: '/products/indoor' },
    { label: product.name },
  ],
  sizeVariants = [
    { id: 1, name: 'Small', price: 1199 },
    { id: 2, name: 'Medium', price: 1499 },
    { id: 3, name: 'Large', price: 1999 },
  ],
  potVariants = [
    { id: 1, name: 'No Pot', price: 0 },
    { id: 2, name: 'Ceramic', price: 299, tag: 'Most Loved' },
    { id: 3, name: 'Wooden', price: 499 },
  ],
  onAddToCart,
  onBuyNow,
}: ProductDetailCardProps) {
  const [activeSize, setActiveSize] = useState(1);
  const [activePot, setActivePot] = useState(1);
  const [isGift, setIsGift] = useState(false);

  const handleAddToCart = () => {
    onAddToCart?.(1, activeSize, activePot, isGift);
  };

  const handleBuyNow = () => {
    onBuyNow?.(1, activeSize, activePot, isGift);
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Breadcrumb */}
      <div className="py-1 sm:py-1.5 px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Main Product Section - Responsive Grid */}
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 lg:gap-12">
          {/* Left - Image Gallery (55% - 6 cols out of 11) */}
          <div className="w-full lg:col-span-6 lg:sticky lg:top-0 lg:h-fit">
            <ProductGallery />
          </div>

          {/* Right - Product Details (45% - 5 cols out of 11) */}
          <div className="space-y-6 w-full lg:col-span-5">
            {/* Product Info */}
            <ProductInfo
              title={product.name}
              price={product.finalPrice}
              originalPrice={product.originalPrice}
              rating={product.rating}
              reviews={product.reviews}
            />

            {/* Size Variants */}
            <div>
              <h3 className="text-sm font-normal text-gray-900 uppercase mb-3">
                Select Size
              </h3>
              <div className="flex gap-3 flex-wrap">
                {sizeVariants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    active={activeSize === variant.id}
                    onClick={() => setActiveSize(variant.id)}
                  />
                ))}
              </div>
            </div>

            {/* Planter Variants */}
            <div>
              <h3 className="text-sm font-normal text-gray-900 uppercase mb-3">
                Select Planter
              </h3>
              <div className="flex gap-3 flex-wrap">
                {potVariants.map((variant) => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    active={activePot === variant.id}
                    onClick={() => setActivePot(variant.id)}
                  />
                ))}
              </div>
            </div>

            {/* Delivery Checker */}
            <DeliveryChecker />

            {/* Gift Options */}
            <GiftOptions />

            {/* Action Buttons - Stacked */}
            <div className="space-y-4">
              <button
                onClick={handleAddToCart}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-normal py-3 px-4 rounded-lg transition-all"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full bg-white border-2 border-green-600 hover:bg-green-50 text-green-600 font-normal py-3 px-4 rounded-lg transition-all"
              >
                Buy Now
              </button>
            </div>

            {/* Product Details - Below Buttons */}
            {(product.description || product.benefits || product.care) && (
              <div className="mt-8">
                <ProductDetails 
                  description={product.description}
                  benefits={product.benefits}
                  care={product.care}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
