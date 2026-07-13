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
  isActive?: boolean;
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

export default function OffersSection() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getOfferHref = (offer?: Offer) => offer?.ctaUrl || offer?.buttonLink || '#';
  const displayOffers = offers.filter(o => o.isActive !== false).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));


  useEffect(() => {
    const loadOffers = async () => {
      try {
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
          const nextOffers = (offersPayload.data || []).sort((a: Offer, b: Offer) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setOffers(nextOffers);

          const nextBackgroundImage =
            backgroundsResponse.ok && backgroundsPayload.success && Array.isArray(backgroundsPayload.data) && backgroundsPayload.data.length > 0
              ? (backgroundsPayload.data.find((bg: any) => bg.isActive)?.imageUrl || '')
              : '';
          
          setBackgroundImageUrl(nextBackgroundImage);
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
        
        <p className={`mt-1 text-sm sm:text-base ${backgroundImageUrl ? 'text-white/90 drop-shadow' : 'text-gray-600'}`}>Limited time deals on plants & garden essentials</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        {displayOffers.map((offer, idx) => {
          const isLastOdd = displayOffers.length % 2 !== 0 && idx === displayOffers.length - 1;
          return (
            <motion.div
              key={offer._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`relative rounded-lg sm:rounded-xl overflow-hidden group cursor-pointer h-full ${
                isLastOdd ? 'col-span-2' : ''
              }`}
            >
            <Link href={getOfferHref(offer)} className="block w-full h-full flex flex-col">
              <div className="relative w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
                {offer.bannerImage ? (
                  <img
                    src={offer.bannerImage}
                    alt={offer.title}
                    className="w-full h-auto max-h-[600px] object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center">
                    <span className="text-gray-400 text-sm text-center px-2">{offer.title}</span>
                  </div>
                )}
                {/* Gradient Overlay for Text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                
                {offer.showOfferBadge !== false && (offer.offerPercent > 0 || (offer.discountRupees || 0) > 0) && (
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-red-600 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded sm:rounded-lg font-bold text-xs sm:text-sm shadow-lg">
                    {offer.offerPercent > 0 ? `${offer.offerPercent}% OFF` : `₹${offer.discountRupees || 0} OFF`}
                  </div>
                )}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3 sm:p-5 text-white flex flex-col justify-end">
                <h3 className="font-bold text-sm sm:text-lg md:text-xl line-clamp-2 mb-1 sm:mb-2 drop-shadow-md">{offer.title}</h3>
                {offer.description && (
                  <p className="text-xs sm:text-sm text-gray-200 line-clamp-1 sm:line-clamp-2 mb-2 sm:mb-3 drop-shadow-md">{offer.description}</p>
                )}
                <span className="inline-flex items-center justify-center bg-white text-green-900 hover:bg-green-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors w-fit shadow-sm">
                  {offer.buttonText || 'Shop Now'}
                </span>
              </div>
            </Link>
          </motion.div>
          );
        })}
      </div>
      </div>
    </section>
  );
}
