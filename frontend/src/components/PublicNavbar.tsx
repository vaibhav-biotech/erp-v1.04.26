'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiShoppingBagLine } from 'react-icons/ri';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import CartBadge from '@/components/CartBadge';
import { useAuth } from '@/contexts/AuthContext';

interface Subcategory {
  name: string;
  slug: string;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  subcategories: Subcategory[];
}

export default function PublicNavbar() {
  const router = useRouter();
  const { customerAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5050/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };

    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    fetchCategories();
  }, []);

  // Listen for storage changes (logout from other components)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    const handleAuthChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2 whitespace-nowrap">
            🌿 <span className="hidden sm:inline">Plants In Garden</span><span className="sm:hidden">PIG</span>
          </Link>

          {/* Desktop Categories Menu */}
          <div className="hidden lg:flex gap-6 xl:gap-8 items-center flex-1 ml-8 xl:ml-12">
            {loading ? (
              <span className="text-gray-600">Loading...</span>
            ) : (
              categories.map((category) => (
                <div key={category._id} className="relative group">
                  <Link 
                    href={`/products/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-black font-medium hover:text-gray-700 transition-colors py-2 text-sm xl:text-base"
                  >
                    {category.name}
                  </Link>

                  {/* Dropdown */}
                  <div className="absolute left-0 mt-0 w-56 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {category.subcategories.length > 0 ? (
                      <div className="py-2">
                        {category.subcategories.map((sub, idx) => (
                          <Link
                            key={idx}
                            href={`/products/${sub.slug}`}
                            className="block px-4 py-2 text-black hover:bg-gray-100 transition-colors text-sm"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No subcategories
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Auth Button & Cart - Desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <CartBadge />
            {!customerAuthenticated ? (
              <Link
                href="/auth/login"
                className="px-4 py-2 border-2 border-black text-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium text-sm"
              >
                Login
              </Link>
            ) : (
              <Link
                href="/customer"
                className="text-black font-medium hover:text-gray-700 transition-colors flex items-center gap-2 text-sm"
              >
                <span>👤</span>
                My Account
              </Link>
            )}
          </div>

          {/* Mobile Menu - Cart & Hamburger */}
          <div className="lg:hidden flex items-center gap-4">
            <CartBadge />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-black text-2xl"
            >
              {mobileMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Categories */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
            {loading ? (
              <span className="text-gray-600">Loading...</span>
            ) : (
              categories.map((category) => (
                <div key={category._id} className="py-3 border-b border-gray-100">
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === category._id ? null : category._id)}
                    className="text-black font-medium text-left w-full flex items-center justify-between hover:text-gray-700 transition-colors"
                  >
                    <span>{category.name}</span>
                    {category.subcategories.length > 0 && (
                      <FiChevronDown 
                        className={`transition-transform ${expandedCategory === category._id ? 'rotate-180' : ''}`}
                        size={18}
                      />
                    )}
                  </button>
                  
                  {expandedCategory === category._id && category.subcategories.length > 0 && (
                    <div className="pl-4 space-y-2 mt-2">
                      {category.subcategories.map((sub, idx) => (
                        <Link
                          key={idx}
                          href={`/products/${sub.slug}`}
                          className="block text-black text-sm hover:text-gray-700 transition-colors"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setExpandedCategory(null);
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
            
            {/* Mobile Auth Links */}
            <div className="py-3 border-t border-gray-100 space-y-2">
              {!customerAuthenticated ? (
                <Link
                  href="/auth/login"
                  className="block px-4 py-2 border-2 border-black text-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium text-center text-sm"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              ) : (
                <Link
                  href="/customer"
                  className="block text-black font-medium hover:text-gray-700 transition-colors text-center text-sm py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👤 My Account
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
