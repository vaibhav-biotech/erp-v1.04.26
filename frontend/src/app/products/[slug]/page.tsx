'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import ProductGrid from '@/components/ProductGrid';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface Subcategory {
  name: string;
  slug: string;
}

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

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductsPage({ params }: Props) {
  const { slug } = use(params);
  const normalizeSlug = (value: string) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [category, setCategory] = useState<{ name: string; _id: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();

    const fetchCategoriesAndProducts = async () => {
      try {
        const catRes = await fetch(buildApiUrl('/api/categories'), { signal: controller.signal, headers: getApiHeaders() });

        if (!catRes.ok) throw new Error('Failed to fetch categories');

        const catData = await catRes.json();

        const categories = catData.data || [];

        // Resolve slug to category or subcategory
        let foundCategory = categories.find((c: any) => {
          const categorySlug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
          return categorySlug === slug || c._id === slug;
        });
        let foundSubcategory: Subcategory | null = null;
        let foundCategoryId = '';
        let isMainCategory = false;
        let resolvedCategoryName = '';

        if (foundCategory) {
          foundCategoryId = foundCategory._id;
          resolvedCategoryName = foundCategory.name;
          setCategoryName(foundCategory.name);
          setCategory(foundCategory);
          setDisplayName(foundCategory.name);
          isMainCategory = true;
        } else {
          for (const cat of categories) {
            const sub = (cat.subcategories || []).find((s: Subcategory) => s.slug === slug);
            if (sub) {
              foundSubcategory = sub;
              foundCategoryId = cat._id;
              resolvedCategoryName = cat.name;
              setCategoryName(cat.name);
              setSubcategory(foundSubcategory);
              setDisplayName(foundSubcategory?.name || '');
              break;
            }
          }
        }

        if (!isMainCategory && !foundSubcategory) {
          setError('Category not found');
          setLoading(false);
          return;
        }

        const prodRes = await fetch(
          buildApiUrl(`/api/products?status=active&category=${encodeURIComponent(foundCategoryId)}&limit=400`),
          { signal: controller.signal, headers: getApiHeaders() }
        );

        if (!prodRes.ok) throw new Error('Failed to fetch products');

        const prodData = await prodRes.json();

        console.log(`🔍 Total products from API: ${prodData.data?.length || 0}`);
        console.log(`📍 Page slug: ${slug}, normalized: ${normalizeSlug(slug)}`);
        console.log(`🏢 Is main category: ${isMainCategory}`);

        // Filter client-side only for subcategory if needed
        const filtered = (prodData.data || []).filter((p: Product) => {
          const matchesCategory = p.category === foundCategoryId
            || p.categoryName?.toLowerCase() === resolvedCategoryName.toLowerCase();
          if (!isMainCategory) {
            const normalizedPageSlug = normalizeSlug(slug);
            const productSubcategory = normalizeSlug(p.subcategory || '');
            const productTags = Array.isArray(p.tags) ? p.tags.map((tag) => normalizeSlug(tag)).filter(Boolean) : [];
            const matchesSubcategoryOrTag = productSubcategory === normalizedPageSlug || productTags.includes(normalizedPageSlug);
            
            if (!matchesSubcategoryOrTag) {
              console.log(`❌ ${p.name}: subcat="${productSubcategory}", tags=[${productTags.join(', ')}], page="${normalizedPageSlug}"`);
            }
            
            return matchesCategory && matchesSubcategoryOrTag;
          }
          return matchesCategory;
        });

        console.log(`✅ Filtered products: ${filtered.length}`);

        // Deduplicate by _id
        const seen = new Set<string>();
        const deduplicatedProducts = filtered.filter((product: Product) => {
          if (seen.has(product._id)) return false;
          seen.add(product._id);
          return true;
        });

        setProducts(deduplicatedProducts);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndProducts();

    return () => controller.abort();
  }, [slug]);

  if (loading) {
    return (
      <>
        <PublicNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6">
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
        <PublicFooter />
      </>
    );
  }

  if (error || (!subcategory && !category)) {
    return (
      <>
        <PublicNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-gray-600 text-lg font-montserrat">
            {error || 'Category not found'}
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
            {displayName}
          </h1>
        </motion.div>

        {/* Product Grid with Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          <ProductGrid
            products={products}
            categoryName={categoryName}
            onFilterChange={(filters) => {
              console.log('Filters applied:', filters);
            }}
          />
        </motion.div>
      </div>
      <PublicFooter />
    </>
  );
}

