'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

export default function CartBadge() {
  const { cartCount, toggleCartModal } = useCart();

  return (
    <motion.button
      onClick={toggleCartModal}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <ShoppingCart size={24} className="text-gray-900" />

      {/* Cart Count Badge */}
      {cartCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center font-montserrat font-bold text-xs"
        >
          {cartCount > 9 ? '9+' : cartCount}
        </motion.div>
      )}
    </motion.button>
  );
}
