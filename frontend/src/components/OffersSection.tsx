'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import Link from 'next/link';
import Image from 'next/image';

interface Offer {
  _id: string;
  title: string;
  description?: string;
  offerPercent: number;
  showOfferBadge?: boolean;
  discountRupees?: number;
  bannerImage: string;
  bannerGridSize?: '250x250' | '500x250' | '600x600';
  gridPosition?: number;
  ctaUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder: number;
}

interface OffersPayload {
  success: boolean;
  data: Offer[];
}

interface OfferBackground {
  _id: string;
  imageUrl: string;
  isActive: boolean;
}

interface OfferBackgroundPayload {
  success: boolean;
  data: OfferBackground[];
}

const OFFERS_CACHE_KEY = 'landing_offers_v1';
const OFFERS_CACHE_TTL_MS = 10 * 60 * 1000;

export default function OffersSection() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getOfferHref = (offer?: Offer) => offer?.ctaUrl || offer?.buttonLink || '#';
  const mappedOfferBySlot = offers.reduce<Record<number, Offer>>((acc, offer) => {
    const gridPositionRaw = Number((offer as Offer & { gridPosition?: string | number }).gridPosition);
    const displayOrderRaw = Number((offer as Offer & { displayOrder?: string | number }).displayOrder);

    let slotIndex = Number.isFinite(gridPositionRaw) && gridPositionRaw >= 1 && gridPositionRaw <= 4
      ? gridPositionRaw - 1
      : Number.isFinite(displayOrderRaw) && displayOrderRaw >= 0 && displayOrderRaw <= 3
        ? displayOrderRaw
        : -1;

    // Fallback for legacy records without position/order
    if (slotIndex < 0) {
      if (offer.bannerGridSize === '600x600') slotIndex = 3;
      else if (offer.bannerGridSize === '500x250') slotIndex = 2;
      else slotIndex = 0;
    }

    if (slotIndex >= 0 && slotIndex <= 3) {
      acc[slotIndex] = offer;
    }
    return acc;
  }, {});

  const assignedOfferIds = new Set(Object.values(mappedOfferBySlot).map((offer) => offer._id));
  const remainingOffers = offers.filter((offer) => !assignedOfferIds.has(offer._id));
  const offerBySlot: Record<number, Offer> = { ...mappedOfferBySlot };

  for (let slot = 0; slot <= 3; slot += 1) {
    if (!offerBySlot[slot] && remainingOffers.length > 0) {
      const next = remainingOffers.shift();
      if (next) offerBySlot[slot] = next;
    }
  }

  useEffect(() => {
    const loadOffers = async () => {
      try {
        if (typeof window !== 'undefined') {
          const raw = sessionStorage.getItem(OFFERS_CACHE_KEY);
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as {
                timestamp: number;
                offers: Offer[];
                backgroundImageUrl: string;
              };

              if (Array.isArray(parsed?.offers) && Date.now() - Number(parsed.timestamp || 0) < OFFERS_CACHE_TTL_MS) {
                setOffers(parsed.offers);
                setBackgroundImageUrl(parsed.backgroundImageUrl || '');
                setIsLoading(false);
                return;
              }
            } catch {
              sessionStorage.removeItem(OFFERS_CACHE_KEY);
            }
          }
        }

        const [offersResponse, backgroundsResponse] = await Promise.all([
          fetch(buildApiUrl('/api/landing/offers'), {
            headers: getApiHeaders(),
          }),
          fetch(buildApiUrl('/api/landing/offers/backgrounds'), {
            headers: getApiHeaders(),
          }),
        ]);

        const offersPayload: OffersPayload = await offersResponse.json();
        const backgroundsPayload: OfferBackgroundPayload = await backgroundsResponse.json();

        if (offersResponse.ok && offersPayload.success) {
          const nextOffers = (offersPayload.data || []).sort((a, b) => a.displayOrder - b.displayOrder);
          setOffers(nextOffers);

          const nextBackgroundImage =
            backgroundsResponse.ok && backgroundsPayload.success && Array.isArray(backgroundsPayload.data) && backgroundsPayload.data.length > 0
              ? (backgroundsPayload.data[0]?.imageUrl || '')
              : '';

          if (typeof window !== 'undefined') {
            sessionStorage.setItem(
              OFFERS_CACHE_KEY,
              JSON.stringify({
                timestamp: Date.now(),
                offers: nextOffers,
                backgroundImageUrl: nextBackgroundImage,
              })
            );
          }
        } else {
          setOffers([]);
        }

        if (backgroundsResponse.ok && backgroundsPayload.success && Array.isArray(backgroundsPayload.data) && backgroundsPayload.data.length > 0) {
          setBackgroundImageUrl(backgroundsPayload.data[0]?.imageUrl || '');
        } else {
          setBackgroundImageUrl('');
        }
      } catch {
        setOffers([]);
        setBackgroundImageUrl('');
      } finally {
        setIsLoading(false);
      }
    };

    loadOffers();
  }, []);

  if (isLoading) {
    return (
      <section
        className="w-full bg-stone-50 bg-cover bg-center"
        style={backgroundImageUrl ? { backgroundImage: `url(${backgroundImageUrl})` } : undefined}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="mb-5 sm:mb-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Special Offers</h2>
            <p className="mt-1 text-sm sm:text-base text-gray-600">Limited time deals on plants & garden essentials</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6 auto-rows-max">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg animate-pulse aspect-square" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="w-full bg-cover bg-center"
      style={backgroundImageUrl ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#f5f5f0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
      <div className="mb-5 sm:mb-6 text-center">
        <h2 className={`text-2xl sm:text-3xl font-bold ${backgroundImageUrl ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>Special Offers</h2>
        <p className={`mt-1 text-sm sm:text-base ${backgroundImageUrl ? 'text-white/90 drop-shadow' : 'text-gray-600'}`}>Limited time deals on plants & garden essentials</p>
      </div>

      {/* Grid Layout: Left (2 top 280x280 + 1 bottom 584x280) + Right (1 big 584x584) */}
      <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-[280px_280px_584px] md:grid-rows-[280px_280px] md:justify-center">
        {/* LEFT TOP - 2 small squares */}
        {Array.from({ length: 2 }).map((_, idx) => {
          const offer = offerBySlot[idx];
          return (
            <motion.div
              key={offer?._id || `top-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative rounded-lg overflow-hidden group cursor-pointer ${idx === 0 ? 'md:col-start-1 md:row-start-1' : 'md:col-start-2 md:row-start-1'}`}
            >
              {offer ? (
                <Link href={getOfferHref(offer)} className="block h-full">
                  <div className="relative w-full aspect-square md:w-full md:h-full md:aspect-auto bg-gray-200">
                    {offer.bannerImage ? (
                      <Image
                        src={offer.bannerImage}
                        alt={offer.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 280px"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                        <span className="text-gray-400 text-xs text-center px-2">{offer.title}</span>
                      </div>
                    )}
                    {offer.showOfferBadge !== false && (offer.offerPercent > 0 || (offer.discountRupees || 0) > 0) && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded font-bold text-xs">
                        {offer.offerPercent > 0 ? `${offer.offerPercent}% OFF` : `₹${offer.discountRupees || 0} OFF`}
                      </div>
                    )}
                  </div>
                    <div className="absolute inset-0 flex flex-col justify-end p-2 text-white">
                      <h3 className="font-bold text-xs line-clamp-2 mb-1 drop-shadow-sm">{offer.title}</h3>
                      <span className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded text-[10px] font-semibold transition-colors w-fit">
                      {offer.buttonText || 'Shop'}
                    </span>
                  </div>
                </Link>
              ) : (
                <div className="hidden md:block" />
              )}
            </motion.div>
          );
        })}

        {/* RIGHT BIG SQUARE */}
        <div className="md:col-start-3 md:row-start-1 md:row-span-2 md:w-full md:h-full">
          {offerBySlot[3] ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative rounded-lg overflow-hidden group cursor-pointer h-full"
            >
              <Link href={getOfferHref(offerBySlot[3])} className="block h-full">
                <div className="relative w-full aspect-square md:w-full md:h-full md:aspect-auto bg-gray-200">
                  {offerBySlot[3].bannerImage ? (
                    <Image
                      src={offerBySlot[3].bannerImage}
                      alt={offerBySlot[3].title}
                      fill
                      sizes="(max-width: 768px) 100vw, 584px"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{offerBySlot[3].title}</span>
                    </div>
                  )}
                  {offerBySlot[3].showOfferBadge !== false && (offerBySlot[3].offerPercent > 0 || (offerBySlot[3].discountRupees || 0) > 0) && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-sm sm:text-base">
                      {offerBySlot[3].offerPercent > 0 ? `${offerBySlot[3].offerPercent}% OFF` : `₹${offerBySlot[3].discountRupees || 0} OFF`}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 text-white">
                  <h3 className="font-bold text-sm sm:text-base line-clamp-2 mb-1 drop-shadow-sm">{offerBySlot[3].title}</h3>
                  {offerBySlot[3].description && (
                    <p className="text-xs sm:text-sm line-clamp-2 text-white mb-2 drop-shadow-sm">{offerBySlot[3].description}</p>
                  )}
                  <span className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors w-fit">
                    {offerBySlot[3].buttonText || 'Shop Now'}
                  </span>
                </div>
              </Link>
            </motion.div>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>

        {/* LEFT BOTTOM - Wide box */}
        <div className="md:col-start-1 md:col-span-2 md:row-start-2 md:w-full md:h-full">
          {offerBySlot[2] ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative rounded-lg overflow-hidden group cursor-pointer"
            >
              <Link href={getOfferHref(offerBySlot[2])} className="block h-full">
                <div className="relative w-full aspect-[2/1] md:w-full md:h-full md:aspect-auto bg-gray-200">
                  {offerBySlot[2].bannerImage ? (
                    <Image
                      src={offerBySlot[2].bannerImage}
                      alt={offerBySlot[2].title}
                      fill
                      sizes="(max-width: 768px) 100vw, 584px"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">{offerBySlot[2].title}</span>
                    </div>
                  )}
                  {offerBySlot[2].showOfferBadge !== false && (offerBySlot[2].offerPercent > 0 || (offerBySlot[2].discountRupees || 0) > 0) && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-2 rounded-lg font-bold text-sm">
                      {offerBySlot[2].offerPercent > 0 ? `${offerBySlot[2].offerPercent}% OFF` : `₹${offerBySlot[2].discountRupees || 0} OFF`}
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 flex flex-col justify-end p-3 text-white">
                  <h3 className="font-bold text-sm line-clamp-2 mb-1 drop-shadow-sm">{offerBySlot[2].title}</h3>
                  {offerBySlot[2].description && (
                    <p className="text-xs line-clamp-1 text-white mb-2 drop-shadow-sm">{offerBySlot[2].description}</p>
                  )}
                  <span className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors w-fit">
                    {offerBySlot[2].buttonText || 'Shop Now'}
                  </span>
                </div>
              </Link>
            </motion.div>
          ) : (
            <div className="hidden md:block" />
          )}
        </div>
      </div>
      </div>
    </section>
  );
}
