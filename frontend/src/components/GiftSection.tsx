'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface GiftBannerItem {
  _id: string;
  title: string;
  desktopImageUrl: string;
  mobileImageUrl: string;
  tag: string;
  isActive: boolean;
}

const CACHE_KEY = 'landing_gift_section_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

export default function GiftSection() {
  const [item, setItem] = useState<GiftBannerItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let showedCached = false;
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { timestamp: number; data: GiftBannerItem | null };
              if (Date.now() - Number(parsed?.timestamp || 0) < CACHE_TTL_MS) {
                setItem(parsed?.data || null);
                setLoading(false);
                showedCached = true;
              }
            } catch {
              sessionStorage.removeItem(CACHE_KEY);
            }
          }
        }

        const res = await fetch(buildApiUrl('/api/landing/gift-section'), {
          headers: getApiHeaders(),
        });

        if (!res.ok) {
          if (!showedCached) setItem(null);
          return;
        }

        const payload = await res.json();
        const all = Array.isArray(payload?.data) ? payload.data as GiftBannerItem[] : [];
        const active = all.find((x) => x.isActive) || all[0] || null;
        setItem(active);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: active }));
        }
      } catch {
        setItem((prev) => prev);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading || !item) return null;

  return (
    <section className="w-full">
      <Link href={`/products/${item.tag || 'gifts'}`} className="block relative w-full">
        <div className="relative w-full h-screen overflow-hidden">
          <Image
            src={item.desktopImageUrl}
            alt={item.title || 'Gift banner'}
            fill
            className="hidden sm:block object-cover"
            sizes="100vw"
            priority={false}
          />
          <Image
            src={item.mobileImageUrl || item.desktopImageUrl}
            alt={item.title || 'Gift banner mobile'}
            fill
            className="sm:hidden object-cover"
            sizes="100vw"
            priority={false}
          />

          <div className="absolute inset-0 bg-black/25" />

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-10 text-white">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Gift Collection</p>
            <h2 className="mt-2 text-2xl sm:text-4xl lg:text-5xl font-bold leading-tight">{item.title || 'Shop Gifts'}</h2>
            <span className="mt-3 inline-flex items-center text-sm sm:text-base font-semibold">Explore gifts →</span>
          </div>
        </div>
      </Link>
    </section>
  );
}
