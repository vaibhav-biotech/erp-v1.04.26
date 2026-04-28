'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import PublicLayout from '@/components/PublicLayout';
import ProductDetailCard from '@/components/ProductDetailCard';
import { useCart } from '@/contexts/CartContext';
import { buildApiUrl } from '@/lib/storeConfig';

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
  sizeVariants?: Array<{ id: number; name: string; price: number; originalPrice?: number; tag?: string }>;
  potVariants?: Array<{ id: number; name: string; price: number; tag?: string }>;
}

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart, clearCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();

    const fetchProduct = async () => {
      try {
        const [res, catRes] = await Promise.all([
          fetch(buildApiUrl(`/api/products/${id}`), { signal: controller.signal }),
          fetch(buildApiUrl('/api/categories'), { signal: controller.signal }),
        ]);

        if (!res.ok) {
          throw new Error('Product not found');
        }

        const data = await res.json();
        const productData = data.data;

        if (!productData) {
          throw new Error('No product data received');
        }

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
        setProduct(productData);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();

    return () => controller.abort();
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

  const handleBuyNow = (quantity: number, size: number, pot: number, _isGift: boolean) => {
    if (!product) return;

    const selectedSize = product.sizeVariants?.find((v) => v.id === size);
    const selectedPot = product.potVariants?.find((v) => v.id === pot);

    const sizeVariant = {
      id: String(size),
      name: selectedSize?.name || 'Standard',
      price: selectedSize?.price ?? product.finalPrice,
    };

    const potVariant = {
      id: String(pot),
      name: selectedPot?.name || 'No Pot',
      price: selectedPot?.price ?? 0,
    };

    const unitPrice = sizeVariant.price + potVariant.price;

    clearCart();
    addToCart(
      {
        productId: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        sizeVariant,
        potVariant,
        quantity,
        totalPrice: unitPrice,
      },
      true
    );

    router.push('/checkout');
  };

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
            sizeVariants={product.sizeVariants}
            potVariants={product.potVariants}
            onBuyNow={handleBuyNow}
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
