'use client';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { useState } from 'react';

interface ActionButtonsProps {
  onAddToCart?: () => void;
  onBuyNow?: () => void;
  isLoading?: boolean;
}

export default function ActionButtons({ 
  onAddToCart, 
  onBuyNow,
  isLoading = false 
}: ActionButtonsProps) {
  const [quantity, setQuantity] = useState(1);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div className="space-y-4">
      {/* Quantity and Buttons Row */}
      <div className="flex gap-3 items-stretch w-full">
        {/* Quantity Tracker */}
        <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-3 bg-white">
          <button
            onClick={handleDecrease}
            className="text-gray-600 hover:text-gray-900 transition-all"
          >
            <FiMinus size={18} />
          </button>
          <span className="w-8 text-center font-semibold text-gray-900">{quantity}</span>
          <button
            onClick={handleIncrease}
            className="text-gray-600 hover:text-gray-900 transition-all"
          >
            <FiPlus size={18} />
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={onAddToCart}
          disabled={isLoading}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
        >
          Add to Cart
        </button>
      </div>

      {/* Buy Now Button - Full Width */}
      <button
        onClick={onBuyNow}
        disabled={isLoading}
        className="w-full bg-white border-2 border-green-600 hover:bg-green-50 text-green-600 font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50"
      >
        Buy Now
      </button>
    </div>
  );
}
