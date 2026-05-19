'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RiShoppingBagLine } from 'react-icons/ri';
import { FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import CartBadge from '@/components/CartBadge';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import { readSessionCache, writeSessionCache } from '@/lib/sessionCache';

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

interface NotificationConfig {
  message: string;
  bgColor: string;
  textColor: string;
  fontWeight: 'regular' | 'bold';
  isActive: boolean;
}

interface WebsiteLogo {
  _id: string;
  logoUrl: string;
  alt?: string;
  isActive: boolean;
}

const DEFAULT_NOTIFICATION: NotificationConfig = {
  message: '🌿 Free shipping on orders above ₹499',
  bgColor: '#fef08a',
  textColor: '#713f12',
  fontWeight: 'regular',
  isActive: true,
};

const CATEGORIES_CACHE_KEY = 'public_nav_categories_v1';
const NOTIFICATION_CACHE_KEY = 'public_nav_notifications_v1';
const LOGO_CACHE_KEY = 'public_nav_logo_v1';
const NAV_CACHE_TTL = 15 * 60 * 1000;

export default function PublicNavbar() {
  const router = useRouter();
  const { customerAuthenticated, logoutCustomer } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [activeNotifications, setActiveNotifications] = useState<NotificationConfig[]>([DEFAULT_NOTIFICATION]);
  const [currentNotificationIndex, setCurrentNotificationIndex] = useState(0);
  const [websiteLogo, setWebsiteLogo] = useState<WebsiteLogo | null>(null);
  const [logoLoading, setLogoLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cached = readSessionCache<Category[]>(CATEGORIES_CACHE_KEY, NAV_CACHE_TTL);
        if (cached) {
          setCategories(cached);
          setLoading(false);
          return;
        }

        const headers = getApiHeaders();
        const res = await fetch(buildApiUrl('/api/categories'), { headers });
        if (res.ok) {
          const data = await res.json();
          const nextCategories = data.data || [];
          setCategories(nextCategories);
          writeSessionCache(CATEGORIES_CACHE_KEY, nextCategories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchNotificationConfig = async () => {
      try {
        const cached = readSessionCache<NotificationConfig[]>(
          NOTIFICATION_CACHE_KEY,
          NAV_CACHE_TTL
        );
        if (cached?.length) {
          setActiveNotifications(cached);
          setCurrentNotificationIndex(0);
          return;
        }

        const headers = getApiHeaders();
        const res = await fetch(buildApiUrl('/api/notification-bar'), { headers });
        if (!res.ok) return;

        const data = await res.json();
        const fromList = Array.isArray(data?.notifications) ? data.notifications : [];

        if (fromList.length > 0) {
          const parsed = fromList
            .filter((item: any) => item?.isActive !== false)
            .map((item: any) => ({
              message: item?.message || DEFAULT_NOTIFICATION.message,
              bgColor: item?.bgColor || DEFAULT_NOTIFICATION.bgColor,
              textColor: item?.textColor || DEFAULT_NOTIFICATION.textColor,
              fontWeight: item?.fontWeight === 'bold' ? 'bold' : 'regular',
              isActive: true,
            } as NotificationConfig));

          const next = parsed.length > 0 ? parsed : [DEFAULT_NOTIFICATION];
          setActiveNotifications(next);
          setCurrentNotificationIndex(0);
          writeSessionCache(NOTIFICATION_CACHE_KEY, next);
          return;
        }

        const config = data?.data;
        if (config && config.isActive !== false) {
          const next: NotificationConfig[] = [
            {
              message: config.message || DEFAULT_NOTIFICATION.message,
              bgColor: config.bgColor || DEFAULT_NOTIFICATION.bgColor,
              textColor: config.textColor || DEFAULT_NOTIFICATION.textColor,
              fontWeight: config.fontWeight === 'bold' ? 'bold' : 'regular',
              isActive: true,
            },
          ];
          setActiveNotifications(next);
          setCurrentNotificationIndex(0);
          writeSessionCache(NOTIFICATION_CACHE_KEY, next);
        }
      } catch {
        // keep defaults silently
      }
    };

    fetchNotificationConfig();
  }, []);

  useEffect(() => {
    const fetchWebsiteLogo = async () => {
      try {
        const cached = readSessionCache<WebsiteLogo>(LOGO_CACHE_KEY, NAV_CACHE_TTL);
        if (cached) {
          setWebsiteLogo(cached);
          return;
        }

        const res = await fetch(buildApiUrl('/api/landing/website-logo'), {
          headers: getApiHeaders(),
        });
        if (!res.ok) {
          setWebsiteLogo(null);
          return;
        }

        const payload = await res.json();
        const items = Array.isArray(payload?.data) ? (payload.data as WebsiteLogo[]) : [];
        const active = items.find((item) => item?.isActive) || items[0] || null;
        setWebsiteLogo(active || null);
        if (active) writeSessionCache(LOGO_CACHE_KEY, active);
      } catch {
        setWebsiteLogo(null);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchWebsiteLogo();
  }, []);

  useEffect(() => {
    if (activeNotifications.length <= 1) return;

    const id = window.setInterval(() => {
      setCurrentNotificationIndex((prev) => (prev + 1) % activeNotifications.length);
    }, 3000);

    return () => window.clearInterval(id);
  }, [activeNotifications]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;

      if (currentY <= 10) {
        setIsNavVisible(true);
        lastScrollY = currentY;
        return;
      }

      if (currentY > lastScrollY + 4) {
        setIsNavVisible(false);
      } else if (currentY < lastScrollY - 4) {
        setIsNavVisible(true);
      }

      lastScrollY = currentY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const currentNotification = activeNotifications[currentNotificationIndex] || DEFAULT_NOTIFICATION;
  const hasNotificationBar = Boolean(currentNotification?.isActive && currentNotification?.message);

  return (
    <div
      className={`sticky top-0 z-40 transition-transform duration-300 ${
        isNavVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      {hasNotificationBar && (
        <div
          className="border-b text-center text-xs sm:text-sm px-3 py-2"
          style={{
            backgroundColor: currentNotification.bgColor,
            color: currentNotification.textColor,
            borderColor: currentNotification.bgColor,
            fontWeight: currentNotification.fontWeight === 'bold' ? 700 : 500,
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={`${currentNotificationIndex}-${currentNotification.message}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              {currentNotification.message}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      <nav className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-black flex items-center whitespace-nowrap">
            <div className="h-9 sm:h-11 w-[170px] sm:w-[240px] flex items-center">
              {websiteLogo?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={websiteLogo.logoUrl}
                  alt={websiteLogo.alt || 'Store Logo'}
                  className="h-full w-full object-cover object-left"
                />
              ) : logoLoading ? (
                <div className="h-full w-full" />
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2">
                  🌿 <span className="hidden sm:inline">Plants In Garden</span><span className="sm:hidden">PIG</span>
                </span>
              )}
            </div>
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
              <div className="relative">
                <button
                  onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                  className="text-black font-medium hover:text-gray-700 transition-colors flex items-center gap-2 text-sm px-3 py-2 rounded-lg hover:bg-gray-100"
                >
                  <span>👤</span>
                  My Account
                  <FiChevronDown size={16} className={`transition-transform ${accountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown Menu */}
                {accountDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <Link
                      href="/customer"
                      className="block px-4 py-2 text-black hover:bg-gray-50 transition-colors text-sm border-b border-gray-100"
                      onClick={() => setAccountDropdownOpen(false)}
                    >
                      👤 My Account
                    </Link>
                    <button
                      onClick={() => {
                        setAccountDropdownOpen(false);
                        logoutCustomer();
                        router.push('/');
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      🚪 Logout
                    </button>
                  </div>
                )}
              </div>
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

        {/* Mobile Menu - Categories (Fixed Overlay Drawer) */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className={`fixed ${hasNotificationBar ? 'top-24' : 'top-16'} left-0 right-0 bottom-0 bg-white z-40 lg:hidden overflow-y-auto shadow-xl`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="pb-4 bg-white">
                {loading ? (
                  <span className="text-gray-600 block px-4 py-4 bg-white">Loading...</span>
                ) : (
                  categories.map((category) => (
                    <div key={category._id} className="py-3 border-b border-gray-100 bg-white">
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === category._id ? null : category._id)}
                        className="text-black font-medium text-left w-full px-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
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
                          className="block text-black text-sm hover:text-gray-700 transition-colors bg-white hover:bg-gray-50 px-3 py-2"
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
            <div className="py-3 px-4 border-t border-gray-100 space-y-2 bg-white">
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </nav>
    </div>
  );
}
