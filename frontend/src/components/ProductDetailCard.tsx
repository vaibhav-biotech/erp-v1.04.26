'use client';

import { useState } from 'react';
import ProductGallery from '@/components/ProductGallery';
import VariantCard from '@/components/VariantCard';
import Breadcrumb from '@/components/Breadcrumb';
import { ProductInfo } from '@/components/productinfo';
import { DeliveryChecker } from '@/components/deliveryChecker';
import { GiftOptions } from '@/components/GiftOptions';
import ProductDetails from '@/components/ProductDetails';
import AddToCartButton from '@/components/AddToCartButton';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Variant {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
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
    images?: string[];
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
    { id: 1, name: 'Small', price: 299 },
    { id: 2, name: 'Medium', price: 399 },
    { id: 3, name: 'Large', price: 599 },
  ],
  potVariants = [
    { id: 1, name: 'No Pot', price: 0 },
    { id: 2, name: 'Standard Pot', price: 99 },
    { id: 3, name: 'Premium Ceramic', price: 199, tag: 'Most Loved' },
  ],
  onAddToCart,
  onBuyNow,
}: ProductDetailCardProps) {
  const [activeSize, setActiveSize] = useState(1);
  const [activePot, setActivePot] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedGiftOption, setSelectedGiftOption] = useState<{ _id: string; name: string; price: number } | null>(null);

  // Debug: Log what we're receiving
  console.log('🔍 ProductDetailCard received:', {
    productName: product.name,
    sizeVariants,
    potVariants,
    discount: product.discount
  });

  // Ensure sizeVariants and potVariants have fallback values
  const validSizeVariants = (sizeVariants && sizeVariants.length > 0) 
    ? sizeVariants 
    : [{ id: 1, name: 'Default', price: product.finalPrice || 0, tag: undefined }];
  
  const validPotVariants = (potVariants && potVariants.length > 0) 
    ? potVariants 
    : [{ id: 1, name: 'No Pot', price: 0, tag: undefined }];

  // Get selected variant details with fallback
  const selectedSize = validSizeVariants.find((v) => v.id === activeSize) || validSizeVariants[0];
  const selectedPot = validPotVariants.find((v) => v.id === activePot) || validPotVariants[0];

  // Calculate prices
  const plantPrice = selectedSize?.price || 0;
  const potPrice = selectedPot?.price || 0;
  const giftPrice = selectedGiftOption?.price || 0;
  const totalPrice = plantPrice + potPrice + giftPrice;

  // For display (use variant's originalPrice if available, else use product's originalPrice)
  const displayFinalPrice = totalPrice;
  const variantOriginalPrice = selectedSize?.originalPrice || product.originalPrice;
  const displayOriginalPrice = variantOriginalPrice + (selectedPot?.price || 0) + (selectedGiftOption?.price || 0);

  const handleAddToCart = () => {
    onAddToCart?.(quantity, activeSize, activePot, !!selectedGiftOption);
  };

  const handleBuyNow = () => {
    onBuyNow?.(quantity, activeSize, activePot, !!selectedGiftOption);
  };

  return (
    <div className="min-h-screen bg-transparent pb-24 lg:pb-0">
      {/* Breadcrumb */}
      <div className="py-1 sm:py-1.5 px-4 sm:px-6 lg:px-8">
        <Breadcrumb items={breadcrumbs} />
      </div>

      {/* Main Product Section - Responsive Grid */}
      <div className="py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-8 lg:gap-12">
          {/* Left - Image Gallery (55% - 6 cols out of 11) */}
          <div className="w-full lg:col-span-6 lg:sticky lg:top-0 lg:h-fit">
            <ProductGallery images={product.images} />
          </div>

          {/* Right - Product Details (45% - 5 cols out of 11) */}
          <div className="space-y-6 w-full lg:col-span-5">
            {/* Product Info */}
            <ProductInfo
              title={product.name}
              price={displayFinalPrice}
              originalPrice={displayOriginalPrice}
              rating={product.rating}
              reviews={product.reviews}
              plantPrice={plantPrice}
              potPrice={potPrice}
            />

            {/* Size Variants */}
            <div>
              <h3 className="text-sm font-normal text-gray-900 uppercase mb-3">
                Select Size
              </h3>
              <div className="flex gap-3 flex-wrap">
                {validSizeVariants.map((variant) => (
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
                {validPotVariants.map((variant) => (
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
            <GiftOptions onGiftSelected={setSelectedGiftOption} />

            {/* Quantity + Action Buttons (single row) */}
            <div className="flex items-stretch gap-2">
              <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden h-[52px] shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition h-full"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[42px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 transition h-full"
                >
                  +
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <AddToCartButton
                  productId={product.id}
                  productName={product.name}
                  productImage={product.images?.[0] || '/placeholder.jpg'}
                  quantity={quantity}
                  sizeVariant={{
                    id: String(activeSize),
                    name: selectedSize.name,
                    price: selectedSize.price,
                  }}
                  potVariant={{
                    id: String(activePot),
                    name: selectedPot.name,
                    price: selectedPot.price,
                  }}
                  giftWrap={selectedGiftOption ? {
                    _id: selectedGiftOption._id,
                    name: selectedGiftOption.name,
                    price: selectedGiftOption.price,
                  } : undefined}
                />
              </div>

              <button
                onClick={handleBuyNow}
                className="min-w-[120px] bg-white border-2 border-green-600 hover:bg-green-50 text-green-600 text-sm font-medium px-4 rounded-lg transition-all h-[52px] shrink-0"
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

      {/* Mobile/Tablet Sticky Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Selected Price</p>
              <p className="text-base font-semibold text-gray-900">₹{displayFinalPrice.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex-1">
              <AddToCartButton
                productId={product.id}
                productName={product.name}
                productImage={product.images?.[0] || '/placeholder.jpg'}
                quantity={quantity}
                sizeVariant={{
                  id: String(activeSize),
                  name: selectedSize.name,
                  price: selectedSize.price,
                }}
                potVariant={{
                  id: String(activePot),
                  name: selectedPot.name,
                  price: selectedPot.price,
                }}
                giftWrap={selectedGiftOption ? {
                  _id: selectedGiftOption._id,
                  name: selectedGiftOption.name,
                  price: selectedGiftOption.price,
                } : undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
