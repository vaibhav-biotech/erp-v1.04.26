'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import ProductGrid from '@/components/ProductGrid';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch(buildApiUrl('/api/products?status=active&limit=500'), {
          headers: getApiHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch products');
        
        const data = await res.json();
        const allProducts = data.data || [];
        
        const lowercaseQuery = query.toLowerCase();
        const filtered = allProducts.filter((p: any) => {
          return (
            p.name?.toLowerCase().includes(lowercaseQuery) ||
            p.categoryName?.toLowerCase().includes(lowercaseQuery) ||
            p.subcategory?.toLowerCase().includes(lowercaseQuery) ||
            p.tags?.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery))
          );
        });
        
        setProducts(filtered);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to load search results.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 min-h-[60vh]">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <h1 className="text-3xl font-playfair font-normal text-gray-900 mb-2">
          Search Results
        </h1>
        <p className="text-gray-600 font-montserrat">
          {products.length} {products.length === 1 ? 'result' : 'results'} for &quot;{query}&quot;
        </p>
      </motion.div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 font-montserrat">{error}</p>
        </div>
      ) : products.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <ProductGrid
            products={products}
            categoryName="Search Results"
            onFilterChange={() => {}}
          />
        </motion.div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <p className="text-gray-500 font-montserrat text-lg">
            No products found matching &quot;{query}&quot;.
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            Try checking for typos or using different keywords.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <>
      <PublicNavbar />
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 flex items-center justify-center">
          <p className="text-gray-500 font-montserrat">Loading search results...</p>
        </div>
      }>
        <SearchResults />
      </Suspense>
      <PublicFooter />
    </>
  );
}
