'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface FeaturedCollectionItem {
  _id: string;
  title: string;
  subtitle?: string;
  tag: string;
  imageUrl?: string;
  isActive: boolean;
}

interface FeaturedCollectionsBackground {
  _id: string;
  imageUrl: string;
  isActive: boolean;
}

const CACHE_KEY = 'landing_featured_collections_v1';
const CACHE_TTL_MS = 10 * 60 * 1000;
const BG_CACHE_KEY = 'landing_featured_collections_background_v1';
const DESKTOP_PER_PAGE = 3;

export default function FeaturedCollectionsSection() {
  const [items, setItems] = useState<FeaturedCollectionItem[]>([]);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [mobileIndex, setMobileIndex] = useState(0);
  const [desktopOffset, setDesktopOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        let showedCached = false;
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as { timestamp: number; data: FeaturedCollectionItem[] };
              if (Array.isArray(parsed?.data) && Date.now() - Number(parsed.timestamp || 0) < CACHE_TTL_MS) {
                setItems(parsed.data);
                setLoading(false);
                showedCached = true;
              }
            } catch {
              sessionStorage.removeItem(CACHE_KEY);
            }
          }
        }

        if (typeof window !== 'undefined') {
          const bgRaw = sessionStorage.getItem(BG_CACHE_KEY);
          if (bgRaw) {
            try {
              const parsedBg = JSON.parse(bgRaw) as { timestamp: number; imageUrl: string };
              if (parsedBg?.imageUrl && Date.now() - Number(parsedBg.timestamp || 0) < CACHE_TTL_MS) {
                setBackgroundImageUrl(parsedBg.imageUrl);
              }
            } catch {
              sessionStorage.removeItem(BG_CACHE_KEY);
            }
          }
        }

        const [res, bgRes] = await Promise.all([
          fetch(buildApiUrl('/api/landing/featured-collections'), { headers: getApiHeaders() }),
          fetch(buildApiUrl('/api/landing/featured-collections/backgrounds'), { headers: getApiHeaders() }),
        ]);

        if (!res.ok) {
          if (!showedCached) setItems([]);
          return;
        }

        const payload = await res.json();
        const nextItems = Array.isArray(payload?.data) ? payload.data : [];
        setItems(nextItems);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: nextItems }));
        }

        if (bgRes.ok) {
          const bgPayload = await bgRes.json();
          const bgItems = Array.isArray(bgPayload?.data) ? bgPayload.data as FeaturedCollectionsBackground[] : [];
          const activeBg = bgItems.find((item) => item.isActive) || bgItems[0];
          const nextUrl = activeBg?.imageUrl || '';
          setBackgroundImageUrl(nextUrl);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(BG_CACHE_KEY, JSON.stringify({ timestamp: Date.now(), imageUrl: nextUrl }));
          }
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

  const desktopVisible = items.slice(desktopOffset, desktopOffset + DESKTOP_PER_PAGE);
  const canPrevDesktop = desktopOffset > 0;
  const canNextDesktop = desktopOffset + DESKTOP_PER_PAGE < items.length;
  const canPrevMobile = mobileIndex > 0;
  const canNextMobile = mobileIndex < items.length - 1;

  const CardLink = ({ item }: { item: FeaturedCollectionItem }) => (
    <Link
      href={`/products/${item.tag}`}
      className="group relative overflow-hidden rounded-3xl bg-gray-900 w-full shadow-sm block"
      style={{ minHeight: '440px' }}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-emerald-400" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-white">
        <h3 className="text-2xl sm:text-3xl font-bold leading-tight">{item.title}</h3>
        {item.subtitle ? (
          <p className="mt-2 text-sm sm:text-base text-white/85 max-w-md">{item.subtitle}</p>
        ) : null}
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-white/95">
          Explore collection →
        </span>
      </div>
    </Link>
  );

  return (
    <section
      className="w-full relative overflow-hidden py-10 sm:py-12 lg:py-14"
      style={backgroundImageUrl ? {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      {backgroundImageUrl && (
        <div className="absolute inset-0 backdrop-blur-sm bg-black/40" />
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header row */}
        <div className="flex items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-green-400">Curated Picks</p>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Featured Collections</h2>
            <p className="mt-2 text-sm sm:text-base text-white/75 max-w-2xl">
              Explore hand-picked plant collections grouped by style, mood and care needs.
            </p>
          </div>

          {/* Desktop scroll arrows — only if more than 3 */}
          {items.length > DESKTOP_PER_PAGE && (
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setDesktopOffset((p) => Math.max(0, p - 1))}
                disabled={!canPrevDesktop}
                className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={() => setDesktopOffset((p) => Math.min(items.length - DESKTOP_PER_PAGE, p + 1))}
                disabled={!canNextDesktop}
                className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition"
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          )}
        </div>

        {/* Desktop grid — 3 at a time */}
        <div className="hidden lg:grid grid-cols-3 gap-5 lg:gap-6">
          {desktopVisible.map((item) => (
            <CardLink key={item._id} item={item} />
          ))}
        </div>

        {/* Mobile / Tablet — one card + dot + arrow nav */}
        <div className="lg:hidden">
          <div ref={scrollRef}>
            <CardLink item={items[mobileIndex]} />
          </div>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setMobileIndex((p) => Math.max(0, p - 1))}
              disabled={!canPrevMobile}
              className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition"
            >
              <FiChevronLeft size={20} />
            </button>
            <div className="flex gap-1.5 items-center">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMobileIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === mobileIndex ? 'bg-white w-5' : 'bg-white/40 w-2'}`}
                />
              ))}
            </div>
            <button
              onClick={() => setMobileIndex((p) => Math.min(items.length - 1, p + 1))}
              disabled={!canNextMobile}
              className="w-10 h-10 rounded-full border border-white/40 text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30 transition"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
