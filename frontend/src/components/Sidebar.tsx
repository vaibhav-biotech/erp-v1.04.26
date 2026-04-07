'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiList,
  FiUsers,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
} from 'react-icons/fi';

interface SidebarProps {
  onPageChange: (page: string) => void;
  currentPage: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function Sidebar({ onPageChange, currentPage }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { logout } = useAuth();

  const menuItems: MenuItem[] = [
    { id: 'home', label: 'Home', icon: <FiHome className="w-5 h-5" /> },
    { id: 'categories', label: 'Categories', icon: <FiPackage className="w-5 h-5" /> },
    { id: 'products', label: 'Products', icon: <FiShoppingCart className="w-5 h-5" /> },
    { id: 'orders', label: 'Orders', icon: <FiList className="w-5 h-5" /> },
    { id: 'customers', label: 'Customers', icon: <FiUsers className="w-5 h-5" /> },
  ];

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-white border-r border-gray-200 transition-all duration-300 min-h-screen flex flex-col fixed left-0 top-0 z-50`}
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
        {isOpen && (
          <h1 className="text-xl font-bold text-black">🌿 Menu</h1>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
        >
          {isOpen ? (
            <FiChevronLeft className="w-5 h-5" />
          ) : (
            <FiChevronRight className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              currentPage === item.id
                ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={!isOpen ? item.label : ''}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors font-medium"
          title={!isOpen ? 'Logout' : ''}
        >
          <FiLogOut className="w-5 h-5 flex-shrink-0" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
