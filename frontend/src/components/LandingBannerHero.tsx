'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface LandingBanner {
  _id: string;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
}

const HERO_BANNERS_CACHE_KEY = 'landing_hero_banners_v1';
const HERO_BANNERS_CACHE_TTL_MS = 10 * 60 * 1000;

export default function LandingBannerHero() {
  const [banners, setBanners] = useState<LandingBanner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    const controller = new AbortController();

    const loadBanners = async () => {
      try {
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(HERO_BANNERS_CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { timestamp: number; data: LandingBanner[] };
              if (Array.isArray(parsed?.data) && Date.now() - Number(parsed.timestamp || 0) < HERO_BANNERS_CACHE_TTL_MS) {
                setBanners(parsed.data);
                setIsLoading(false);
                return;
              }
            } catch {
              sessionStorage.removeItem(HERO_BANNERS_CACHE_KEY);
            }
          }
        }

        const response = await fetch(buildApiUrl('/api/landing/banners'), {
          headers: getApiHeaders(),
          signal: controller.signal,
        });
        const payload = await response.json();

        if (response.ok && payload.success) {
          const nextBanners = payload.data || [];
          setBanners(nextBanners);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              HERO_BANNERS_CACHE_KEY,
              JSON.stringify({ timestamp: Date.now(), data: nextBanners })
            );
          }
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setBanners([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBanners();

    return () => controller.abort();
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
                  <Image
                    src={banner.imageUrl}
                    alt={banner.title || 'Hero banner'}
                    fill
                    sizes="100vw"
                    className="w-full h-full object-cover"
                    priority={activeIndex === 0}
                  />
                );

                return (
                  <div key={banner._id} className="w-full h-full shrink-0 relative">
                    {banner.linkUrl ? (
                      <Link href={banner.linkUrl} className="block w-full h-full relative">
                        {content}
                      </Link>
                    ) : (
                      <div className="w-full h-full relative">{content}</div>
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
