'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import ProductGrid from '@/components/ProductGrid';

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
  status?: string;
}

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductsPage({ params }: Props) {
  const { slug } = use(params);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [category, setCategory] = useState<{ name: string; _id: string } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchCategoriesAndProducts = async () => {
      try {
        // Step 1: Fetch categories
        const { buildApiUrl } = await import('@/lib/storeConfig');
        const catRes = await fetch(buildApiUrl('/api/categories'));
        if (!catRes.ok) throw new Error('Failed to fetch categories');

        const catData = await catRes.json();
        const categories = catData.data || [];

        // Check if slug is a CATEGORY
        let foundCategory = categories.find((c: any) => {
          // Try matching by category ID or by slug (convert name to lowercase slug)
          const categorySlug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
          return categorySlug === slug || c._id === slug;
        });
        let foundSubcategory: Subcategory | null = null;
        let foundCategoryId = '';
        let isMainCategory = false;

        if (foundCategory) {
          // Slug is a category
          foundCategoryId = foundCategory._id;
          setCategoryName(foundCategory.name);
          setCategory(foundCategory);
          setDisplayName(foundCategory.name);
          isMainCategory = true;
        } else {
          // Check if slug is a SUBCATEGORY
          for (const cat of categories) {
            const sub = cat.subcategories.find((s: Subcategory) => s.slug === slug);
            if (sub) {
              foundSubcategory = sub;
              foundCategoryId = cat._id;
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

        // Step 2: Fetch products
        const prodRes = await fetch(buildApiUrl('/api/products'));
        if (!prodRes.ok) throw new Error('Failed to fetch products');

        const prodData = await prodRes.json();
        
        // Debug: Log what we're working with
        console.log('🔍 Debug Info:');
        console.log('   foundCategoryId:', foundCategoryId);
        console.log('   categoryName:', categoryName);
        console.log('   isMainCategory:', isMainCategory);
        console.log('   slug:', slug);
        console.log('   foundSubcategory:', foundSubcategory);
        console.log('   First product:', prodData.data?.[0]);
        
        // Filter products by category NAME and status (works with all products)
        const filtered = (prodData.data || []).filter((p: Product) => {
          const matchesCategory = p.categoryName?.toLowerCase() === categoryName.toLowerCase() || p.category === foundCategoryId;
          const isActive = p.status === 'active';
          
          console.log(`   Product "${p.name}": categoryName="${p.categoryName}" vs "${categoryName}" = ${matchesCategory}, status="${p.status}" = ${isActive}`);
          
          // If it's a subcategory, also filter by subcategory
          if (!isMainCategory) {
            const matchesSub = p.subcategory === slug;
            console.log(`      subcategory="${p.subcategory}" vs "${slug}" = ${matchesSub}`);
            return matchesCategory && matchesSub && isActive;
          }
          
          // If it's a main category, show all active products in that category
          return matchesCategory && isActive;
        });

        // 🎯 DEDUPLICATION: Remove duplicate products by _id
        const seen = new Set<string>();
        const deduplicatedProducts = filtered.filter((product: Product) => {
          if (seen.has(product._id)) {
            console.log(`⚠️ Removing duplicate product: ${product.name} (${product._id})`);
            return false;
          }
          seen.add(product._id);
          return true;
        });

        console.log('✅ Fetched products:', prodData.data?.length || 0);
        console.log('📊 Filtered for this category/subcategory:', filtered.length);
        console.log('🎯 After deduplication:', deduplicatedProducts.length);
        setProducts(deduplicatedProducts);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndProducts();
  }, [slug]);

  if (loading) {
    return (
      <>
        <PublicNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-gray-600 text-lg font-montserrat">Loading products...</p>
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

