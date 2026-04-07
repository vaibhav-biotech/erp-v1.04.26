'use client';

import Link from 'next/link';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

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
              Your one-stop destination for premium plants and gardening solutions.
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
                <Link href="/login" className="text-stone-600 hover:text-black transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <a href="#" className="text-stone-600 hover:text-black transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-stone-600 hover:text-black transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-black mb-3 sm:mb-4 text-sm sm:text-base">Get in Touch</h3>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-stone-600">
              <li>Email: info@plantsingarden.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li className="hidden sm:block">Address: Garden Lane, Greenville, CA 90210</li>
              <li className="sm:hidden">Garden Lane, Greenville, CA</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-stone-300 pt-6 sm:pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-2 text-xs sm:text-sm text-stone-600">
            <p>&copy; {currentYear} Plants In Garden. All rights reserved.</p>
            <div className="flex gap-3 sm:gap-6 text-center sm:text-left">
              <a href="#" className="hover:text-black transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-black transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
