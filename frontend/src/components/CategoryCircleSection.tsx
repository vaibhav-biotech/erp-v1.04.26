'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface CategoryCircleItem {
  _id: string;
  categoryName: string;
  categorySlug: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder?: number;
}

const CACHE_KEY = 'landing_category_circle_section_v2';
const CACHE_TTL_MS = 10 * 60 * 1000;

export default function CategoryCircleSection() {
  const [items, setItems] = useState<CategoryCircleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let showedCachedItems = false;

        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { timestamp: number; data: CategoryCircleItem[] };
              if (Array.isArray(parsed?.data) && Date.now() - Number(parsed.timestamp || 0) < CACHE_TTL_MS) {
                setItems(parsed.data);
                setLoading(false);
                showedCachedItems = true;
              }
            } catch {
              sessionStorage.removeItem(CACHE_KEY);
            }
          }
        }

        const res = await fetch(buildApiUrl('/api/landing/category-section'), {
          headers: getApiHeaders(),
        });

        if (!res.ok) {
          if (!showedCachedItems) {
            setItems([]);
          }
          return;
        }

        const payload = await res.json();
        const nextItems = Array.isArray(payload?.data) ? payload.data : [];
        setItems(nextItems);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: nextItems }));
        }
      } catch {
        setItems((prev) => prev);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading || items.length === 0) return null;

  const scrollingItems = items.length > 1 ? [...items, ...items] : items;

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 lg:mb-10">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
            Shop by Category
          </h2>
          <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            Find your perfect plants, seeds, planters and garden essentials.
          </p>
        </div>

        <div className="relative overflow-hidden md:hidden">
          <div className={`flex w-max gap-6 sm:gap-8 ${items.length > 1 ? 'category-scroll-track' : ''}`}>
            {scrollingItems.map((item, index) => (
              <Link
                key={`${item._id}-${index}`}
                href={`/products/${item.categorySlug || item.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
                className="w-[120px] sm:w-[140px] flex-shrink-0 flex flex-col items-center text-center group"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-gray-100 ring-4 ring-white group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.categoryName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 640px) 80px, 96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>
                <span className="mt-3 text-xs sm:text-sm font-semibold text-gray-800 leading-tight whitespace-nowrap">
                  {item.categoryName}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex md:flex-wrap md:justify-center md:gap-8 lg:gap-10">
          {items.map((item) => (
            <Link
              key={item._id}
              href={`/products/${item.categorySlug || item.categoryName.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-[150px] lg:w-[170px] flex-shrink-0 flex flex-col items-center text-center group"
            >
              <div className="relative w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden border border-gray-200 shadow-sm bg-gray-100 ring-4 ring-white group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.categoryName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 1024px) 96px, 112px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                )}
              </div>
              <span className="mt-3 text-sm lg:text-base font-semibold text-gray-800 leading-tight whitespace-nowrap">
                {item.categoryName}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style jsx>{`
        .category-scroll-track {
          animation: category-scroll 28s linear infinite;
        }

        @keyframes category-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
