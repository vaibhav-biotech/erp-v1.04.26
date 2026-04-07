'use client';

import { useEffect, useState, use } from 'react';
import PublicLayout from '@/components/PublicLayout';

interface Subcategory {
  name: string;
  slug: string;
}

interface Props {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductsPage({ params }: Props) {
  const { slug } = use(params);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5050/api/categories');
        if (res.ok) {
          const data = await res.json();
          const categories = data.data || [];

          // Find the subcategory
          for (const cat of categories) {
            const sub = cat.subcategories.find((s: Subcategory) => s.slug === slug);
            if (sub) {
              setSubcategory(sub);
              break;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [slug]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-8 py-16 text-center">
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!subcategory) {
    return (
      <PublicLayout>
        <div className="max-w-7xl mx-auto px-8 py-16 text-center">
          <p className="text-gray-600 text-lg">Subcategory not found</p>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-black mb-4">
            Welcome to {subcategory.name}
          </h1>
          <p className="text-xl text-gray-600">
            Browse our collection of {subcategory.name.toLowerCase()}
          </p>
        </div>

        {/* Products will be added here */}
        <div className="mt-16 bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-600">
            Products for "{subcategory.name}" will be displayed here soon.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
