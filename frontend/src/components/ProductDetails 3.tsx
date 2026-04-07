'use client';

import { FiHeart, FiCheck, FiMinus, FiPlus } from 'react-icons/fi';
import Button from '@/components/Button';
import { useState } from 'react';

interface ProductDetailsProps {
  product?: {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    rating: number;
    reviews: number;
    originalPrice: number;
    discount: number;
    finalPrice: number;
    images: string[];
    description: string;
    inStock: boolean;
    sizes: Array<{ id: number; name: string; stock: number }>;
    pots: Array<{ id: number; name: string; price: number }>;
    care: Array<{ title: string; desc: string }>;
    deliveryDays: number;
  };
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(1);
  const [selectedPot, setSelectedPot] = useState(1);

  // Default product if none provided
  const defaultProduct = {
    id: '1',
    name: 'Monstera - Green Plant',
    category: 'Plants',
    subcategory: 'Indoor Plants',
    rating: 4.8,
    reviews: 256,
    originalPrice: 1599,
    discount: 25,
    finalPrice: 1199,
    images: ['', '', '', ''],
    description: 'Stunning Monstera plant with beautiful split leaves. Perfect for modern home decor and air purification.',
    inStock: true,
    sizes: [
      { id: 1, name: 'Small', stock: 15 },
      { id: 2, name: 'Medium', stock: 8 },
      { id: 3, name: 'Large', stock: 3 },
    ],
    pots: [
      { id: 1, name: 'No Pot', price: 0 },
      { id: 2, name: 'Ceramic', price: 299 },
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

  const prod = product || defaultProduct;

  return (
    <div className="bg-amber-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="px-16 py-4 border-b border-gray-200 text-sm text-gray-600">
        Home / {prod.category} / {prod.subcategory} / {prod.name}
      </div>

      {/* Main Content */}
      <div className="px-16 py-8">
        <div className="grid grid-cols-2 gap-12">
          {/* Left Column - Images (Sticky) */}
          <div className="space-y-4 sticky top-0 h-fit">
            {/* Main Image - Gray Placeholder */}
            <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-gray-200">
              {prod.images[0] ? (
                <img
                  src={prod.images[0]}
                  alt={prod.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">Product Image</span>
              )}
            </div>

            {/* Thumbnail Gallery */}
            <div className="flex gap-2 overflow-x-auto">
              {prod.images.map((img, idx) => (
                <div
                  key={idx}
                  className="w-16 h-16 flex-shrink-0 rounded-lg cursor-pointer border-2 border-gray-300 hover:border-gray-600 transition-all bg-gray-100"
                >
                  {img ? (
                    <img
                      src={img}
                      alt={`thumb-${idx}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      {idx + 1}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-3">
            {/* Product Name & Rating */}
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-black">{prod.name}</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500 text-lg">★★★★☆</span>
                  <span className="text-gray-600 text-sm">{prod.rating}</span>
                  <span className="text-gray-500 text-sm">({prod.reviews} reviews)</span>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-1 p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900">₹{prod.finalPrice}</span>
                <span className="text-sm text-gray-400 line-through">₹{prod.originalPrice}</span>
                <span className="text-red-600 px-2 py-1 rounded text-xs font-semibold">
                  {prod.discount}% OFF
                </span>
              </div>
              <p className="text-xs text-gray-600">Inclusive of all taxes</p>
            </div>

            {/* Size Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase">Size</label>
              <div className="flex gap-2 w-fit">
                {prod.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`px-4 py-3 border-2 rounded relative transition-all whitespace-nowrap flex flex-col items-center ${
                      selectedSize === size.id
                        ? 'border-teal-500 bg-teal-50 text-teal-900'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {selectedSize === size.id && (
                      <FiCheck className="absolute top-1 right-1 w-4 h-4 text-teal-600" />
                    )}
                    <div className="font-medium text-sm">{size.name}</div>
                    <div className="text-xs opacity-75">₹{prod.finalPrice}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pot Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 uppercase">Planter</label>
              <div className="flex gap-2 w-fit">
                {prod.pots.map((pot) => (
                  <button
                    key={pot.id}
                    onClick={() => setSelectedPot(pot.id)}
                    className={`px-4 py-3 border-2 rounded relative transition-all whitespace-nowrap flex flex-col items-center ${
                      selectedPot === pot.id
                        ? 'border-teal-500 bg-teal-50 text-teal-900'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {selectedPot === pot.id && (
                      <FiCheck className="absolute top-1 right-1 w-4 h-4 text-teal-600" />
                    )}
                    <div className="font-medium text-sm">{pot.name}</div>
                    <div className="text-xs opacity-75">₹{pot.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="p-2 border border-gray-200 rounded-lg space-y-1">
              <p className="text-xs font-semibold text-gray-700">🚚 Delivery in {prod.deliveryDays} days</p>
              <p className="text-xs text-gray-600">Free shipping ₹500+</p>
            </div>

            {/* Quantity & Actions */}
            <div className="space-y-2">
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
              </div>

              <div className="flex gap-2">
                <Button variant="primary" fullWidth>
                  Cart
                </Button>
                <Button variant="secondary" fullWidth>
                  Buy
                </Button>
                <button className="p-2 border border-gray-300 rounded hover:bg-gray-50">
                  <FiHeart className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* About Section */}
            <div className="mt-8 pt-8 border-t border-gray-200 space-y-4">
              <h2 className="text-2xl font-bold text-black">About</h2>
              <p className="text-gray-700 leading-relaxed text-sm">{prod.description}</p>
            </div>

            {/* Care Instructions */}
            <div className="space-y-4 pb-8">
              <h2 className="text-2xl font-bold text-black">Care Guide</h2>
              <div className="space-y-3">
                {prod.care.map((item, idx) => (
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
