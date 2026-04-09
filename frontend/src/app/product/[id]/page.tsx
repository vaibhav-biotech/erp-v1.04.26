'use client';

import { useEffect, useState, use } from 'react';
import { motion } from 'framer-motion';
import PublicLayout from '@/components/PublicLayout';
import ProductDetailCard from '@/components/ProductDetailCard';

interface Product {
  _id: string;
  name: string;
  category: string;
  categoryName?: string;
  subcategory: string;
  subcategoryName?: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  finalPrice: number;
  discount?: number;
  description?: string;
  benefits?: string[];
  care?: string[];
  images: string[];
  stock: number;
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        // Fetch the product by ID
        const res = await fetch(`http://localhost:5050/api/products/${id}`);
        if (!res.ok) {
          throw new Error('Product not found');
        }

        const data = await res.json();
        const productData = data.data;

        if (!productData) {
          throw new Error('No product data received');
        }

        // Fetch categories to get category and subcategory names
        const catRes = await fetch('http://localhost:5050/api/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          const categories = catData.data || [];

          // Find category and subcategory names
          for (const cat of categories) {
            if (cat._id === productData.category) {
              productData.categoryName = cat.name;
              const sub = cat.subcategories?.find(
                (s: { slug: string }) => s.slug === productData.subcategory
              );
              if (sub) {
                productData.subcategoryName = sub.name;
              }
              break;
            }
          }
        }

        console.log('✅ Fetched product:', productData);
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-gray-600 text-lg font-montserrat">Loading product...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !product) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16 text-center">
          <p className="text-gray-600 text-lg font-montserrat">
            {error || 'Product not found'}
          </p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <motion.div
        className="max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        >
          <ProductDetailCard
            product={{
              id: product._id,
              name: product.name,
              category: product.categoryName || product.category,
              subcategory: product.subcategoryName || product.subcategory,
              rating: product.rating,
              reviews: product.reviews,
              originalPrice: product.originalPrice,
              finalPrice: product.finalPrice,
              discount: product.discount || 0,
              description: product.description,
              benefits: product.benefits,
              care: product.care,
              images: product.images,
            }}
            breadcrumbs={[
              { label: 'Home', href: '/' },
              { label: product.categoryName || 'Category', href: `/products/${product.category}` },
              { label: product.subcategoryName || 'Subcategory', href: `/products/${product.subcategory}` },
              { label: product.name },
            ]}
          />
        </motion.div>
      </motion.div>
    </PublicLayout>
  );
}
