'use client';

import { useEffect, useState } from 'react';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import ProductGridCard from '@/components/ProductGridCard';

interface TopPickProduct {
  _id: string;
  name: string;
  finalPrice: number;
  originalPrice: number;
  discount?: number;
  rating: number;
  reviews: number;
  images: string[];
  benefits?: string[];
}

interface TopPicksPayload {
  title: string;
  subheading: string;
  productCount: number;
  products: TopPickProduct[];
}

const TOP_PICKS_CACHE_KEY = 'landing_top_picks_v1';
const TOP_PICKS_CACHE_TTL_MS = 10 * 60 * 1000;

export default function TopPicksSection() {
  const [data, setData] = useState<TopPicksPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTopPicks = async () => {
      try {
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(TOP_PICKS_CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { timestamp: number; data: TopPicksPayload };
              if (parsed?.data && Date.now() - Number(parsed.timestamp || 0) < TOP_PICKS_CACHE_TTL_MS) {
                setData(parsed.data);
                setIsLoading(false);
                return;
              }
            } catch {
              sessionStorage.removeItem(TOP_PICKS_CACHE_KEY);
            }
          }
        }

        const response = await fetch(buildApiUrl('/api/landing/top-picks'), {
          headers: getApiHeaders(),
        });
        const payload = await response.json();

        if (response.ok && payload.success) {
          const nextData = payload.data || null;
          setData(nextData);
          if (nextData && typeof window !== 'undefined') {
            sessionStorage.setItem(TOP_PICKS_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: nextData }));
          }
        }
      } catch {
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadTopPicks();
  }, []);

  if (isLoading) {
    return (
      <section className="py-8 sm:py-10">
        <div className="mb-5 sm:mb-6 text-center">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto mt-2" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-8 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data || !Array.isArray(data.products) || data.products.length === 0) {
    return null;
  }

  return (
    <section className="py-8 sm:py-10">
      <div className="mb-5 sm:mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{data.title || 'Top Picks'}</h2>
        {data.subheading ? <p className="mt-1 text-sm sm:text-base text-gray-600">{data.subheading}</p> : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {data.products.slice(0, data.productCount || 4).map((product) => (
          <ProductGridCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
