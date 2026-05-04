'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchWithStore } from '@/lib/storeConfig';

interface FooterSettings {
  brandDescription?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  addressLine1?: string;
  addressLine2?: string;
}

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState<FooterSettings | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetchWithStore('/api/landing/footer-settings');
        if (!res.ok) return;

        const payload = await res.json();
        if (!mounted) return;
        if (payload?.data && typeof payload.data === 'object') {
          setSettings(payload.data as FooterSettings);
        }
      } catch {
        // noop, footer will use fallback values
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const footerInfo = useMemo(() => ({
    brandDescription: settings?.brandDescription || 'Your one-stop destination for premium plants and gardening solutions.',
    email: settings?.email || 'info@plantsingarden.com',
    phone: settings?.phone || '+91-9000000000',
    whatsapp: settings?.whatsapp || '+91-9000000000',
    addressLine1: settings?.addressLine1 || 'Garden Lane, Greenville',
    addressLine2: settings?.addressLine2 || 'CA 90210',
  }), [settings]);

  return (
    <footer className="bg-stone-100 border-t border-stone-300 mt-12 sm:mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand Section */}
          <div>
            <div className="text-xl sm:text-2xl font-bold text-black flex items-center gap-2 mb-3 flex-wrap">
              🌿 <span className="hidden sm:inline">Plants In Garden</span><span className="sm:hidden">PIG</span>
            </div>
            <p className="text-stone-600 text-xs sm:text-sm">
              {footerInfo.brandDescription}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-black mb-3 sm:mb-4 text-sm sm:text-base">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <Link href="/" className="text-stone-600 hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-stone-600 hover:text-black transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-stone-600 hover:text-black transition-colors">
                  Admin
                </Link>
              </li>
              <li>
                <Link href="/about-us" className="text-stone-600 hover:text-black transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="text-stone-600 hover:text-black transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-black mb-3 sm:mb-4 text-sm sm:text-base">Get in Touch</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-stone-600">
              <li>Email: {footerInfo.email}</li>
              <li>Phone: {footerInfo.phone}</li>
              <li>WhatsApp: {footerInfo.whatsapp}</li>
              <li className="hidden sm:block">Address: {footerInfo.addressLine1}, {footerInfo.addressLine2}</li>
              <li className="sm:hidden">{footerInfo.addressLine1}</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-300 pt-6 sm:pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2 text-xs sm:text-sm text-stone-600">
            <p>&copy; {currentYear} Plants In Garden. All rights reserved.</p>
            <div className="flex gap-3 sm:gap-6 text-center sm:text-left">
              <Link href="/privacy-policy" className="hover:text-black transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="hover:text-black transition-colors">
                Terms & Conditions
              </Link>
              <Link href="/shipping-policy" className="hover:text-black transition-colors">
                Shipping Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
