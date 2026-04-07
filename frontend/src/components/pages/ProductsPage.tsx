'use client';

import ProductGallery from '@/components/ProductGallery';
import VariantCard from '@/components/VariantCard';
import Breadcrumb from '@/components/Breadcrumb';
import { useState } from 'react';
import Button from '@/components/Button';
import { FiMinus, FiPlus } from 'react-icons/fi';

export default function ProductsPage() {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedPot, setSelectedPot] = useState(1);

  // Sample product data
  const product = {
    id: '1',
    name: 'Monstera - Green Plant',
    category: 'Plants',
    subcategory: 'Indoor Plants',
    rating: 4.8,
    reviews: 256,
    originalPrice: 1599,
    discount: 25,
    finalPrice: 1199,
    description: 'Stunning Monstera plant with beautiful split leaves. Perfect for modern home decor and air purification.',
    inStock: true,
    sizes: [
      { id: 1, name: 'Small', stock: 15 },
      { id: 2, name: 'Medium', stock: 8 },
      { id: 3, name: 'Large', stock: 3 },
    ],
    pots: [
      { id: 1, name: 'No Pot', price: 0 },
      { id: 2, name: 'Ceramic', price: 299, tag: 'Most Loved' },
      { id: 3, name: 'Wooden', price: 499 },
    ],
    care: [
      { title: 'Watering', desc: 'Water when soil is dry. Avoid overwatering.' },
      { title: 'Light', desc: 'Bright indirect sunlight. Can tolerate low light.' },
      { title: 'Temperature', desc: 'Keep between 16-29°C. Avoid drafts.' },
      { title: 'Humidity', desc: 'Loves humidity. Mist leaves weekly.' },
    ],
    deliveryDays: 2,
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="px-16 py-4">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: product.category, href: `/products` },
            { label: product.subcategory, href: `/products/${product.category.toLowerCase()}` },
            { label: product.name },
          ]}
        />
      </div>

      {/* Main Content */}
      <div className="px-16 py-8">
        <div className="grid grid-cols-2 gap-12">
          {/* Left Column - Gallery */}
          <div className="sticky top-0 h-fit">
            <ProductGallery />
          </div>

          {/* Right Column - Details */}
          <div className="space-y-3">
            {/* Product Name & Rating */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-black">{product.name}</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-lg">★★★★☆</span>
                  <span className="text-gray-600 text-sm">{product.rating}</span>
                  <span className="text-gray-500 text-sm">({product.reviews} reviews)</span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-1 p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">₹{product.finalPrice}</span>
                <span className="text-sm text-gray-400 line-through">₹{product.originalPrice}</span>
                <span className="text-red-600 px-2 py-1 rounded text-xs font-semibold">
                  {product.discount}% OFF
                </span>
              </div>
              <p className="text-xs text-gray-600">Inclusive of all taxes</p>
            </div>

            {/* Size Selection */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Select Plant Size</label>
              <div className="flex gap-3 flex-wrap">
                {product.sizes.map((size) => (
                  <VariantCard
                    key={size.id}
                    variant={{
                      name: size.name,
                      price: product.finalPrice,
                    }}
                    active={selectedSize === size.id}
                    onClick={() => setSelectedSize(size.id)}
                  />
                ))}
              </div>
            </div>

            {/* Planter Selection */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Select Planter</label>
              <div className="flex gap-3 flex-wrap">
                {product.pots.map((pot) => (
                  <VariantCard
                    key={pot.id}
                    variant={{
                      name: pot.name,
                      price: pot.price,
                      tag: pot.tag,
                    }}
                    active={selectedPot === pot.id}
                    onClick={() => setSelectedPot(pot.id)}
                  />
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="p-2 border border-gray-200 rounded-lg space-y-1">
              <p className="text-xs font-semibold text-gray-700">🚚 Delivery in {product.deliveryDays} days</p>
              <p className="text-xs text-gray-600">Free shipping ₹500+</p>
            </div>

            {/* Quantity & Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100"
                >
                  <FiMinus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={quantity}
                  readOnly
                  className="w-10 text-center border-0 py-1 focus:outline-none text-sm"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-gray-600 text-sm hover:bg-gray-100"
                >
                  <FiPlus className="w-4 h-4" />
                </button>
              </div>

              <Button variant="primary" className="flex-1">
                Add to Cart
              </Button>
              <Button variant="secondary" className="flex-1">
                Buy Now
              </Button>
            </div>

            {/* About Section */}
            <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
              <h2 className="text-2xl font-bold text-black">About</h2>
              <p className="text-gray-700 leading-relaxed text-sm">{product.description}</p>
            </div>

            {/* Care Instructions */}
            <div className="space-y-4 pb-8">
              <h2 className="text-2xl font-bold text-black">Care Guide</h2>
              <div className="space-y-3">
                {product.care.map((item, idx) => (
                  <div key={idx} className="border-l-2 border-gray-300 pl-3">
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
