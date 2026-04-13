'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useCart, CartItem } from '@/contexts/CartContext';

interface CartItemCardProps {
  item: CartItem;
}

export default function CartItemCard({ item }: CartItemCardProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const pricePerItem = item.totalPrice / item.quantity;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex gap-4 bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 object-cover rounded-lg bg-gray-100"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        {/* Name */}
        <h3 className="font-playfair text-base text-gray-900 mb-1 truncate">
          {item.name}
        </h3>

        {/* Variant Info */}
        <p className="font-montserrat text-xs text-gray-600 mb-2">
          Size: {item.sizeVariant.name} · Pot: {item.potVariant.name}
        </p>

        {/* Price */}
        <p className="font-montserrat font-semibold text-base text-green-600 mb-3">
          ₹{pricePerItem.toFixed(2)}
        </p>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Minus size={16} className="text-gray-900" />
          </button>

          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              updateQuantity(item.productId, val);
            }}
            className="w-10 px-2 py-1 border border-gray-300 rounded text-center font-montserrat text-sm text-gray-900 focus:outline-none focus:border-green-600"
          />

          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <Plus size={16} className="text-gray-900" />
          </button>

          <button
            onClick={() => removeFromCart(item.productId)}
            className="ml-auto p-1 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
