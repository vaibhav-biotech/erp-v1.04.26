'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface CareImage {
  _id: string;
  imageUrl: string;
  isActive: boolean;
  displayOrder: number;
}

const CACHE_KEY = 'landing_care_section_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;

export default function CraftedWithCareSection() {
  const [images, setImages] = useState<CareImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        let showedCached = false;
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { timestamp: number; data: CareImage[] };
              if (Date.now() - Number(parsed?.timestamp || 0) < CACHE_TTL_MS) {
                setImages(parsed?.data || []);
                setLoading(false);
                showedCached = true;
              }
            } catch {
              sessionStorage.removeItem(CACHE_KEY);
            }
          }
        }

        const res = await fetch(buildApiUrl('/api/landing/care-section'), {
          headers: getApiHeaders(),
        });

        if (!res.ok) {
          if (!showedCached) setImages([]);
          return;
        }

        const payload = await res.json();
        const active = Array.isArray(payload?.data) ? (payload.data as CareImage[]) : [];
        setImages(active);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: active }));
        }
      } catch {
        setImages((prev) => prev);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading || images.length === 0) return null;

  return (
    <section className="w-full">
      {/* Section heading */}
      <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 mb-6 px-4">
        Crafted with Care
      </h2>

      {/* Desktop: 3-col grid with equal gaps and side padding */}
      <div className="hidden sm:grid sm:grid-cols-3 gap-4 px-4 sm:px-6 lg:px-8">
        {images.slice(0, 3).map((img, i) => (
          <div key={img._id} className="relative w-full aspect-[4/5] overflow-hidden rounded-xl">
            <Image
              src={img.imageUrl}
              alt={`Care image ${i + 1}`}
              fill
              className="object-cover"
              sizes="33vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {/* Mobile: first image centered, scroll horizontally to see others */}
      <div className="sm:hidden flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-3 px-[7.5vw]">
        {images.slice(0, 3).map((img, i) => (
          <div
            key={img._id}
            className="relative flex-none w-[85vw] aspect-[4/5] overflow-hidden rounded-xl snap-center"
          >
            <Image
              src={img.imageUrl}
              alt={`Care image ${i + 1}`}
              fill
              className="object-cover"
              sizes="85vw"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
