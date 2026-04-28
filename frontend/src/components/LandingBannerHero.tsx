'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface LandingBanner {
  _id: string;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
}

export default function LandingBannerHero() {
  const [banners, setBanners] = useState<LandingBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/landing/banners'), {
          headers: getApiHeaders(),
        });
        const payload = await response.json();

        if (response.ok && payload.success) {
          setBanners(payload.data || []);
        }
      } catch {
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();
  }, []);

  useEffect(() => {
    if (banners.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex >= banners.length) {
      setActiveIndex(0);
    }
  }, [banners.length, activeIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const id = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 4500);

    return () => window.clearTimeout(id);
  }, [activeIndex, banners.length]);

  const hasBanners = useMemo(() => banners.length > 0, [banners.length]);

  return (
    <section className="w-full">
      <div className="w-full aspect-[16/5] bg-white overflow-hidden relative">
        {isLoading ? (
          <div className="w-full h-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
        ) : !hasBanners ? (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500 bg-gray-50">
            No hero banners yet. Add from Store Admin → Landing Page
          </div>
        ) : (
          <div className="w-full h-full relative">
            <div
              className="flex h-full transition-transform duration-500"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {banners.map((banner) => {
                const content = (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title || 'Hero banner'}
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                  />
                );

                return (
                  <div key={banner._id} className="w-full h-full shrink-0">
                    {banner.linkUrl ? (
                      <Link href={banner.linkUrl} className="block w-full h-full">
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </div>
                );
              })}
            </div>

            {banners.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {banners.map((banner, idx) => (
                  <button
                    key={banner._id}
                    onClick={() => setActiveIndex(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeIndex === idx ? 'w-5 bg-white' : 'w-2.5 bg-white/60'
                    }`}
                    aria-label={`Go to banner ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
