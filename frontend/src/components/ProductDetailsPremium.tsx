'use client';

import React, { useState } from 'react';
import { FiChevronDown, FiShoppingCart, FiHeart, FiShare2 } from 'react-icons/fi';

interface Product {
  id?: string;
  _id?: string;
  name: string;
  originalPrice: number;
  finalPrice: number;
  discount?: number;
  rating: number;
  reviews: number;
  images: string[];
  description?: string;
  benefits?: string[];
  care?: string[];
  sizeVariants?: Array<{ id: number; name: string; price: number }>;
  potVariants?: Array<{ id: number; name: string; price: number }>;
  category?: string;
  subcategory?: string;
}

interface Props {
  product: Product;
  onAddToCart?: (quantity: number, size: number, pot: number, isGift: boolean) => void;
  onBuyNow?: (quantity: number, size: number, pot: number, isGift: boolean) => void;
}

export default function ProductDetailsPremium({ product, onAddToCart, onBuyNow }: Props) {
  const [mainImage, setMainImage] = useState(product.images?.[0] || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.sizeVariants?.[0]?.id || 1);
  const [selectedPot, setSelectedPot] = useState(product.potVariants?.[0]?.id || 1);
  const [expandedSection, setExpandedSection] = useState<'description' | 'benefits' | 'care' | null>('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGift, setIsGift] = useState(false);

  const currentSize = product.sizeVariants?.find(s => s.id === selectedSize);
  const currentPot = product.potVariants?.find(p => p.id === selectedPot);
  
  const variantPrice = (currentSize?.price || 0) + (currentPot?.price || 0);
  const totalPrice = product.finalPrice + variantPrice;

  const handleAddToCart = () => {
    onAddToCart?.(quantity, selectedSize, selectedPot, isGift);
  };

  const handleBuyNow = () => {
    onBuyNow?.(quantity, selectedSize, selectedPot, isGift);
  };

  const toggleSection = (section: 'description' | 'benefits' | 'care') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Image Gallery - Full Width Top Section */}
      <div className="w-full bg-gray-50 overflow-hidden">
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Image - 2/3 width on desktop - STICKY */}
            <div className="lg:col-span-2 lg:sticky lg:top-4 lg:h-fit">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square lg:aspect-auto lg:h-[600px]">
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                {product.discount && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    -{product.discount}%
                  </div>
                )}
              </div>

              {/* Thumbnail Carousel */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 mt-6 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMainImage(img)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        mainImage === img ? 'border-green-600' : 'border-gray-300'
                      }`}
                    >
                      <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Panel - Sticky Details */}
            <div className="lg:col-span-1">
              <div className="sticky top-4 space-y-6">
                {/* Product Header */}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                  {product.subcategory && (
                    <p className="text-sm text-gray-600 mb-4">{product.subcategory}</p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-lg ${
                            i < Math.round(product.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {product.rating} ({product.reviews} reviews)
                    </span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t border-b border-gray-200 py-4">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-4xl font-bold text-green-600">₹{totalPrice.toLocaleString()}</span>
                    {product.originalPrice > product.finalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Inclusive of all taxes</p>
                </div>

                {/* Size Selector */}
                {product.sizeVariants && product.sizeVariants.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Select Size
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizeVariants.map(size => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.id)}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            selectedSize === size.id
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : 'border-gray-300 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          {size.name}
                          {size.price > 0 && <span className="text-xs ml-1">+₹{size.price}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pot Selector */}
                {product.potVariants && product.potVariants.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Select Pot
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {product.potVariants.map(pot => (
                        <button
                          key={pot.id}
                          onClick={() => setSelectedPot(pot.id)}
                          className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                            selectedPot === pot.id
                              ? 'border-green-600 bg-green-50 text-green-700'
                              : 'border-gray-300 text-gray-700 hover:border-green-400'
                          }`}
                        >
                          {pot.name}
                          {pot.price > 0 && <span className="text-xs ml-1">+₹{pot.price}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Quantity
                  </label>
                  <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      −
                    </button>
                    <span className="px-6 py-2 border-l border-r border-gray-300">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Gift Option */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => setIsGift(!isGift)}>
                  <input
                    type="checkbox"
                    checked={isGift}
                    onChange={() => setIsGift(!isGift)}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <label className="text-sm font-medium text-gray-700 cursor-pointer flex-1">
                    This is a gift
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCart}
                    className="w-full py-3 px-4 border-2 border-green-600 text-green-600 font-bold rounded-lg hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <FiShoppingCart className="text-xl" />
                    ADD TO CART
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="w-full py-3 px-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    BUY IT NOW
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                      isFavorite
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <FiHeart className={`text-xl ${isFavorite ? 'fill-red-600' : ''}`} />
                    Wishlist
                  </button>
                  <button className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:border-gray-400 transition-all flex items-center justify-center gap-2">
                    <FiShare2 className="text-xl" />
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Sections */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {/* Description Section */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('description')}
              className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors group"
            >
              <h3 className="text-lg font-semibold text-gray-900">Product Description</h3>
              <FiChevronDown
                className={`text-xl text-gray-600 transition-transform duration-300 ${
                  expandedSection === 'description' ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSection === 'description' && (
              <div className="px-6 py-4 bg-white border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}
          </div>

          {/* Benefits Section */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('benefits')}
                className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Key Benefits</h3>
                <FiChevronDown
                  className={`text-xl text-gray-600 transition-transform duration-300 ${
                    expandedSection === 'benefits' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSection === 'benefits' && (
                <div className="px-6 py-4 bg-white border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <ul className="space-y-3">
                    {product.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="text-green-600 font-bold mt-1">✓</span>
                        <span className="text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Care Instructions Section */}
          {product.care && product.care.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('care')}
                className="w-full px-6 py-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
              >
                <h3 className="text-lg font-semibold text-gray-900">Plant Care Tips</h3>
                <FiChevronDown
                  className={`text-xl text-gray-600 transition-transform duration-300 ${
                    expandedSection === 'care' ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {expandedSection === 'care' && (
                <div className="px-6 py-4 bg-white border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-4">
                    {product.care.map((tip, idx) => (
                      <div key={idx}>
                        <h4 className="font-semibold text-gray-900 mb-1 capitalize">
                          {tip.split('\n')[0].replace(/:.*/g, '')}
                        </h4>
                        <p className="text-gray-700 text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
