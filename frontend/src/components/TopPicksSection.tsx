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

export default function TopPicksSection() {
  const [data, setData] = useState<TopPicksPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTopPicks = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/landing/top-picks'), {
          headers: getApiHeaders(),
        });
        const payload = await response.json();

        if (response.ok && payload.success) {
          setData(payload.data || null);
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
    return <div className="py-8 text-sm text-gray-500">Loading top picks...</div>;
  }

  if (!data || !Array.isArray(data.products) || data.products.length === 0) {
    return null;
  }

  return (
    <section className="mt-6 sm:mt-8 py-8 sm:py-10">
      <div className="mb-5 sm:mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{data.title || 'Top Picks'}</h2>
        {data.subheading ? <p className="mt-1 text-sm sm:text-base text-gray-600">{data.subheading}</p> : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.products.slice(0, data.productCount || 4).map((product) => (
          <ProductGridCard key={product._id} product={product} />
        ))}
      </div>
    </section>
  );
}
