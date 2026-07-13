'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import ProductGridCard from '@/components/ProductGridCard';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  images: { url: string }[];
  status: string;
}

interface DynamicSection {
  _id: string;
  title: string;
  isActive: boolean;
  displayOrder: number;
  productIds: Product[];
}

export default function DynamicSections() {
  const [sections, setSections] = useState<DynamicSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(buildApiUrl('/api/landing/dynamic-sections'), {
        headers: getApiHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSections(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching dynamic sections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || sections.length === 0) return null;

  const scrollContainer = (id: string, direction: 'left' | 'right') => {
    const container = document.getElementById(id);
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const mapProductToCardProps = (product: any) => {
    return {
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
    };
  };

  return (
    <div className="w-full flex flex-col items-center">
      {sections.map((section) => {
        // Only render sections that have products
        if (!section.productIds || section.productIds.length === 0) return null;

        return (
          <section key={section._id} className="w-full py-12 bg-white group/section">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-serif text-[#1e3d2f] mb-3">{section.title}</h2>
                  <div className="w-24 h-1 bg-[#2b5a45]"></div>
                </div>
                {section.productIds.length > 4 && (
                  <div className="flex gap-2 self-start md:self-auto opacity-0 group-hover/section:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => scrollContainer(`dynamic-scroll-${section._id}`, 'left')}
                      className="p-3 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#2b5a45] hover:border-[#2b5a45] transition-all bg-white shadow-sm"
                      aria-label="Scroll left"
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => scrollContainer(`dynamic-scroll-${section._id}`, 'right')}
                      className="p-3 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-[#2b5a45] hover:border-[#2b5a45] transition-all bg-white shadow-sm"
                      aria-label="Scroll right"
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <div 
                  id={`dynamic-scroll-${section._id}`}
                  className={`flex ${section.productIds.length > 4 ? 'overflow-x-auto snap-x snap-mandatory gap-6 py-2 hide-scrollbar' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 w-full'}`}
                  style={{ scrollbarWidth: section.productIds.length > 4 ? 'none' : 'auto', msOverflowStyle: section.productIds.length > 4 ? 'none' : 'auto' }}
                >
                  {section.productIds.map((product) => (
                    <div 
                      key={product._id} 
                      className={section.productIds.length > 4 ? "w-[280px] min-w-[280px] sm:w-[300px] sm:min-w-[300px] flex-shrink-0 snap-start" : "w-full"}
                    >
                      <ProductGridCard product={mapProductToCardProps(product)} />
                    </div>
                  ))}
                </div>
              </div>

              {section.productIds.length > 4 && (
                <div className="flex justify-center mt-6">
                  <Link 
                    href={`/collections/${section._id}`}
                    className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-[#2b5a45] text-[#2b5a45] font-medium rounded-full hover:bg-[#2b5a45] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    View More {section.title}
                  </Link>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
