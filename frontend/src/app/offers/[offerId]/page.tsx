'use client';

import { use, useEffect, useMemo, useState } from 'react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import ProductGrid from '@/components/ProductGrid';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface Product {
  _id: string;
  name: string;
  finalPrice: number;
  originalPrice: number;
  discount?: number;
  rating: number;
  reviews: number;
  images: string[];
  potVariants?: Array<{ id: number; name: string; price: number; tag?: string }>;
  sizeVariants?: Array<{ id: number; name: string; price: number; tag?: string }>;
  stock: number;
}

interface Offer {
  _id: string;
  title: string;
  description?: string;
  categoryName?: string;
  offerPercent?: number;
  discountRupees?: number;
}

interface Props {
  params: Promise<{ offerId: string }>;
}

const extractOfferId = (value: string) => {
  const slug = String(value || '');
  const match = slug.match(/[a-f0-9]{24}$/i);
  return match ? match[0] : slug;
};

const applyMaxDiscount = (product: Product, offer: Offer): Product => {
  const originalPrice = Number(product.originalPrice || 0);
  const currentFinalPrice = Number(product.finalPrice || 0);

  if (!originalPrice || originalPrice <= 0) return product;

  const productDiscountRupees = Math.max(0, originalPrice - currentFinalPrice);

  const offerPercent = Number(offer.offerPercent || 0);
  const offerRupees = Number(offer.discountRupees || 0);
  const offerDiscountRupeesFromPercent = offerPercent > 0 ? (originalPrice * offerPercent) / 100 : 0;
  const offerDiscountRupees = Math.max(offerDiscountRupeesFromPercent, offerRupees);

  const bestDiscountRupees = Math.max(productDiscountRupees, offerDiscountRupees);
  const effectiveFinalPrice = Math.max(0, Number((originalPrice - bestDiscountRupees).toFixed(2)));
  const effectiveDiscountPercent = Math.min(100, Math.max(0, Math.round((bestDiscountRupees / originalPrice) * 100)));

  return {
    ...product,
    finalPrice: effectiveFinalPrice,
    discount: effectiveDiscountPercent,
  };
};

export default function OfferProductsPage({ params }: Props) {
  const { offerId } = use(params);
  const parsedOfferId = useMemo(() => extractOfferId(offerId), [offerId]);

  const [offer, setOffer] = useState<Offer | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!parsedOfferId) return;

    const loadOfferProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(buildApiUrl(`/api/landing/offers/${parsedOfferId}`), {
          headers: getApiHeaders(),
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to load offer products');
        }

        const fetchedOffer = (payload.data?.offer || null) as Offer | null;
        const fetchedProducts = Array.isArray(payload.data?.products) ? payload.data.products : [];

        setOffer(fetchedOffer);
        setProducts(
          fetchedOffer
            ? fetchedProducts.map((product: Product) => applyMaxDiscount(product, fetchedOffer))
            : fetchedProducts
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load offer products');
      } finally {
        setLoading(false);
      }
    };

    loadOfferProducts();
  }, [parsedOfferId]);

  if (loading) {
    return (
      <>
        <PublicNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (error || !offer) {
    return (
      <>
        <PublicNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center text-gray-600">
          {error || 'Offer not found'}
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        <h1 className="text-3xl font-playfair font-normal text-gray-900">{offer.title}</h1>
        {offer.description ? <p className="mt-1 text-sm text-gray-600">{offer.description}</p> : null}

        <div className="mt-6">
          <ProductGrid products={products} categoryName={offer.categoryName || 'Offer'} />
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
