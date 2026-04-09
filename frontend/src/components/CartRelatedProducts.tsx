'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface RelatedProduct {
  _id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

export default function CartRelatedProducts() {
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchRelatedProducts();
  }, []);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=4&sort=-featured');
      const data = await response.json();
      setRelatedProducts(data.products?.slice(0, 4) || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || relatedProducts.length === 0) return null;

  return (
    <div className="border-t border-gray-200 py-4 px-4">
      <h3 className="font-montserrat font-semibold text-sm text-gray-900 mb-4 uppercase tracking-wide">
        You may also like
      </h3>

      {/* Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {relatedProducts.map((product, index) => (
          <motion.div
            key={product._id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-40 snap-start"
          >
            {/* Card */}
            <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 hover:border-green-600 transition-colors group cursor-pointer">
              {/* Image */}
              <div className="h-32 bg-gray-100 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>

              {/* Details */}
              <div className="p-3">
                {/* Name */}
                <h4 className="font-playfair text-sm text-gray-900 line-clamp-2 mb-2">
                  {product.name}
                </h4>

                {/* Price */}
                <p className="font-montserrat font-semibold text-base text-green-600 mb-3">
                  €{product.price?.toFixed(2) || '0.00'}
                </p>

                {/* Quick Add Button */}
                <button
                  onClick={() => {
                    addToCart({
                      productId: product._id,
                      name: product.name,
                      image: product.image,
                      sizeVariant: {
                        id: 'default',
                        name: 'Standard',
                        price: product.price * 0.6,
                      },
                      potVariant: {
                        id: 'default',
                        name: 'Standard',
                        price: product.price * 0.4,
                      },
                      quantity: 1,
                      totalPrice: product.price,
                    });
                  }}
                  className="w-full text-center py-2 bg-black text-white rounded font-montserrat text-xs font-bold hover:bg-gray-900 transition-colors"
                >
                  ADD
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All Link */}
      <button className="w-full mt-3 py-2 border border-gray-300 rounded-lg font-montserrat text-xs font-semibold text-gray-900 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1">
        View all products
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
