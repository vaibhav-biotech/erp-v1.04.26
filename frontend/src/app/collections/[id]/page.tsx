'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
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
  category?: string;
  categoryName?: string;
  subcategory?: string;
  tags?: string[];
  status?: string;
}

interface DynamicSection {
  _id: string;
  title: string;
  productIds: any[];
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function CollectionPage({ params }: Props) {
  const { id } = use(params);
  const [section, setSection] = useState<DynamicSection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(buildApiUrl('/api/landing/dynamic-sections'), {
          headers: getApiHeaders(),
        });
        
        if (res.ok) {
          const data = await res.json();
          const sections = data.data || [];
          const foundSection = sections.find((s: DynamicSection) => s._id === id);
          
          if (foundSection) {
            setSection(foundSection);
            
            // Map products to the expected format
            const mappedProducts = (foundSection.productIds || []).map((product: any) => ({
              ...product,
              _id: product._id,
              name: product.name,
              finalPrice: Number(product.finalPrice || product.price || 0),
              originalPrice: Number(product.originalPrice || product.price || 0),
              rating: product.rating || 4.5,
              reviews: product.reviews || 128,
              tags: product.tags || [],
              images: Array.isArray(product.images)
                ? product.images.map((img: any) => (typeof img === 'string' ? img : img.url)).filter(Boolean)
                : []
            }));
            
            setProducts(mappedProducts);
          } else {
            setError('Collection not found');
          }
        } else {
          setError('Failed to fetch collection');
        }
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Error loading collection');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCollection();
    }
  }, [id]);

  if (isLoading) {
    return (
      <>
        <PublicNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/4 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        </div>
        <PublicFooter />
      </>
    );
  }

  if (error || !section) {
    return (
      <>
        <PublicNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-gray-600 text-lg font-montserrat">
            {error || 'Collection not found'}
          </p>
        </div>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
        {/* Header */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h1 className="text-3xl font-playfair font-normal text-gray-900">
            {section.title}
          </h1>
        </motion.div>

        {/* Results Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-gray-200 pb-4">
          <p className="text-gray-600 font-montserrat">
            Showing <span className="font-medium text-gray-900">{products.length}</span> results
          </p>
        </div>

        {/* Product Grid */}
        <ProductGrid products={products} categoryName={section.title} />
      </div>
      <PublicFooter />
    </>
  );
}
