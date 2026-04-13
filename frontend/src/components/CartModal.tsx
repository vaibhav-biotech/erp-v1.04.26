'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import CartItemCard from './CartItemCard';
import CartRelatedProducts from './CartRelatedProducts';
import { X } from 'lucide-react';

export default function CartModal() {
  const {
    cartItems,
    cartOpen,
    toggleCartModal,
    getSubtotal,
    clearCart,
  } = useCart();

  const subtotal = getSubtotal();
  const freeShippingThreshold = 60;
  const remainingForFreeShipping = Math.max(
    0,
    freeShippingThreshold - subtotal
  );
  const showFreeShippingBar = subtotal < freeShippingThreshold;

  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={toggleCartModal}
          />

          {/* Cart Drawer */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-montserrat font-semibold text-lg tracking-widest text-black">
                CART
              </h2>
              <button
                onClick={toggleCartModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={24} className="text-gray-900" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-6">
                  <p className="font-montserrat text-gray-600 text-sm text-center mb-8">
                    Your cart is empty
                  </p>
                  <div className="w-full space-y-3">
                    <p className="font-montserrat text-xs text-gray-500 uppercase tracking-wide text-center mb-4">
                      Continue Shopping
                    </p>
                    {[
                      { name: 'Plants', slug: 'plants' },
                      { name: 'Seeds', slug: 'seeds' },
                      { name: 'Planters', slug: 'planters' },
                      { name: 'Combo Kits', slug: 'combo-kits' },
                      { name: 'Tools & Accessories', slug: 'tools-accessories' },
                    ].map((category) => (
                      <Link
                        key={category.slug}
                        href={`/products/${category.slug}`}
                        onClick={toggleCartModal}
                        className="block w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-montserrat rounded-lg transition-colors text-center"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Free Shipping Bar */}
                  {showFreeShippingBar && (
                    <div className="bg-green-50 border-b border-green-200 p-4">
                      <p className="font-montserrat text-xs text-green-700 text-center">
                        Spend ₹{remainingForFreeShipping.toFixed(2)} more to reach
                        free shipping
                      </p>
                      <div className="w-full bg-gray-300 h-1 rounded-full mt-2">
                        <motion.div
                          className="bg-green-600 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(subtotal / freeShippingThreshold) * 100}%`,
                          }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Cart Items */}
                  <div className="p-4 space-y-4">
                    {cartItems.map((item) => (
                      <CartItemCard key={item.productId} item={item} />
                    ))}
                  </div>

                  {/* You May Also Like */}
                  <CartRelatedProducts />

                  {/* Gift Options */}
                  <div className="px-4 py-3 border-t border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="font-montserrat text-sm text-gray-900">
                        Gift wrap for ₹10.00
                      </span>
                    </label>
                  </div>

                  {/* Order Notes */}
                  <div className="px-4 py-3 border-t border-gray-200">
                    <label className="block font-montserrat text-xs text-gray-600 mb-2">
                      NOTE
                    </label>
                    <textarea
                      placeholder="Add order notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-montserrat text-gray-900 placeholder:text-gray-600 focus:outline-none focus:border-green-600 resize-none"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 p-4 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between font-montserrat text-sm text-gray-900">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <p className="font-montserrat text-xs text-gray-500">
                    Taxes included. Discounts and shipping calculated at checkout.
                  </p>
                </div>

                <button className="w-full bg-black text-white py-3 font-montserrat font-bold text-sm tracking-wide hover:bg-gray-900 transition-colors rounded-lg">
                  CHECK OUT — ₹{subtotal.toFixed(2)} INR
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
