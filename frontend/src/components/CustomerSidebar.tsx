'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Home,
  User,
  MapPin,
  ShoppingBag,
  Heart,
  Star,
  Settings,
  LogOut,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export default function CustomerSidebar() {
  const pathname = usePathname();
  const { logout, customer } = useAuth();

  const menuItems: MenuItem[] = [
    { label: 'Dashboard', href: '/customer', icon: <Home size={20} /> },
    { label: 'Profile', href: '/customer/profile', icon: <User size={20} /> },
    { label: 'Addresses', href: '/customer/addresses', icon: <MapPin size={20} /> },
    { label: 'Orders', href: '/customer/orders', icon: <ShoppingBag size={20} /> },
    { label: 'Wishlist', href: '/customer/wishlist', icon: <Heart size={20} /> },
    { label: 'Reviews', href: '/customer/reviews', icon: <Star size={20} /> },
    { label: 'Settings', href: '/customer/settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 pt-20 overflow-y-auto">
      {/* Customer Info */}
      <div className="px-6 py-4 border-b border-gray-800">
        <p className="font-playfair text-lg text-white">
          {customer?.firstName} {customer?.lastName}
        </p>
        <p className="font-montserrat text-xs text-gray-400">{customer?.email}</p>
      </div>

      {/* Menu Items */}
      <nav className="py-6">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                className={`px-6 py-3 flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white border-l-4 border-green-400'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {item.icon}
                <span className="font-montserrat text-sm">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="px-6 py-4 border-t border-gray-800 mt-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-montserrat text-sm transition-colors"
        >
          <LogOut size={18} />
          Logout
        </motion.button>
      </div>
    </div>
  );
}
