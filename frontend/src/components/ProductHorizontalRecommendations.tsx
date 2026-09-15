'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { useCart } from '@/contexts/CartContext';

interface ProductCard {
  _id: string;
  name: string;
  finalPrice?: number;
  originalPrice?: number;
  images?: string[];
  category?: string;
}

interface ProductHorizontalRecommendationsProps {
  currentProductId: string;
  currentCategory?: string;
}

export default function ProductHorizontalRecommendations({
  currentProductId,
  currentCategory,
}: ProductHorizontalRecommendationsProps) {
  const { addToCart } = useCart();
  const [items, setItems] = useState<ProductCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('/api/products?status=active&limit=24'), {
          headers: getApiHeaders(),
        });
        const payload = await response.json();
        const raw: ProductCard[] = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.products)
            ? payload.products
            : [];

        const withoutCurrent = raw.filter((p) => p._id !== currentProductId);
        const sameCategory = currentCategory
          ? withoutCurrent.filter((p) => p.category === currentCategory)
          : [];

        const merged = (sameCategory.length > 0 ? sameCategory : withoutCurrent).slice(0, 10);
        setItems(merged);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId) fetchProducts();
  }, [currentProductId, currentCategory]);

  const hasItems = useMemo(() => items.length > 0, [items]);

  if (loading || !hasItems) return null;

  return (
    <section className="mt-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-4">
        <h2 className="text-2xl font-playfair text-gray-900">People also buy</h2>
        <p className="text-sm text-gray-600">Recommended products you may like</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
        {items.map((item, index) => {
          const finalPrice = Number(item.finalPrice || 0);
          const originalPrice = Number(item.originalPrice || finalPrice);
          const image = item.images?.[0] || 'https://via.placeholder.com/300?text=Plant';

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="w-48 shrink-0 snap-start"
            >
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow flex flex-col h-full">
                <Link
                  href={`/product/${item._id}`}
                  className="block flex-1"
                >
                  <div className="h-40 bg-gray-100">
                    <img
                      src={image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
  
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                      {item.name}
                    </h3>
  
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold text-green-700">₹{finalPrice.toFixed(2)}</span>
                      {originalPrice > finalPrice && (
                        <span className="text-xs text-gray-500 line-through">₹{originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="p-3 pt-0 mt-auto">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart({
                        productId: item._id,
                        name: item.name,
                        image: image,
                        sizeVariant: { id: 'default', name: 'Standard', price: finalPrice },
                        potVariant: { id: 'default', name: 'No Pot', price: 0 },
                        quantity: 1,
                        totalPrice: finalPrice,
                      });
                    }}
                    className="w-full bg-black text-white text-xs font-bold py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    ADD TO CART
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
