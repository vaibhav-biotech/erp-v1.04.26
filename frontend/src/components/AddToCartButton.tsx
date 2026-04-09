'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  productImage: string;
  sizeVariant: {
    id: string;
    name: string;
    price: number;
  };
  potVariant: {
    id: string;
    name: string;
    price: number;
  };
}

export default function AddToCartButton({
  productId,
  productName,
  productImage,
  sizeVariant,
  potVariant,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = React.useState(false);

  const totalPrice = sizeVariant.price + potVariant.price;

  const handleAddToCart = () => {
    addToCart({
      productId,
      name: productName,
      image: productImage,
      sizeVariant,
      potVariant,
      quantity: 1,
      totalPrice,
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.button
      onClick={handleAddToCart}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full bg-black text-white py-4 rounded-lg font-montserrat font-bold text-sm tracking-wide overflow-hidden group"
    >
      {/* Background animation on hover */}
      <motion.div
        className="absolute inset-0 bg-green-600"
        initial={{ x: '-100%' }}
        whileHover={{ x: 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Text */}
      <div className="relative flex items-center justify-center gap-2">
        {isAdded ? (
          <>
            <motion.svg
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </motion.svg>
            <span>ADDED TO CART</span>
          </>
        ) : (
          <span>ADD TO CART</span>
        )}
      </div>
    </motion.button>
  );
}
