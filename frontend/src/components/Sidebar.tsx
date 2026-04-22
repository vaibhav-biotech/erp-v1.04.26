'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  onPageChange?: (page: string) => void;
  currentPage?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route: string;
  roles?: string[];
}

export default function Sidebar({ onPageChange, currentPage }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const router = useRouter();
  const { logout, logoutAdmin, adminAuthenticated, admin } = useAuth();
  
  const isAdminDashboard = adminAuthenticated;

  
  const menuItems: MenuItem[] = isAdminDashboard ? [
    ...(admin?.role === 'super_admin' 
      ? [{ id: 'home', label: 'Dashboard', icon: <FiHome className="w-5 h-5" />, route: '/admin/dashboard/super-admin', roles: ['super_admin'] }]
      : [{ id: 'home', label: 'Dashboard', icon: <FiHome className="w-5 h-5" />, route: '/admin/dashboard/store-admin', roles: ['store_admin'] }]
    ),
    { id: 'products', label: 'Products', icon: <FiShoppingCart className="w-5 h-5" />, route: '/admin/dashboard/store-admin?page=products', roles: ['store_admin'] },
    { id: 'categories', label: 'Categories', icon: <FiPackage className="w-5 h-5" />, route: '/admin/dashboard/store-admin?page=categories', roles: ['store_admin'] },
    { id: 'orders', label: 'Orders', icon: <FiList className="w-5 h-5" />, route: '/admin/dashboard/store-admin?page=orders', roles: ['store_admin'] },
    { id: 'customers', label: 'Customers', icon: <FiUsers className="w-5 h-5" />, route: '/admin/dashboard/store-admin?page=customers', roles: ['store_admin'] },
    { id: 'all-customers', label: 'All Customers', icon: <FiUsers className="w-5 h-5" />, route: '/admin/dashboard/super-admin?page=all-customers', roles: ['super_admin'] },
    { id: 'analytics', label: 'Analytics', icon: <FiPackage className="w-5 h-5" />, route: '/admin/dashboard/super-admin?page=analytics', roles: ['super_admin'] },
    { id: 'manage-admins', label: 'Manage Admins', icon: <FiUsers className="w-5 h-5" />, route: '/admin/dashboard/super-admin?page=manage-admins', roles: ['super_admin'] },
  ] : [
    { id: 'home', label: 'Home', icon: <FiHome className="w-5 h-5" />, route: '/dashboard?page=home' },
    { id: 'categories', label: 'Categories', icon: <FiPackage className="w-5 h-5" />, route: '/dashboard?page=categories' },
    { id: 'products', label: 'Products', icon: <FiShoppingCart className="w-5 h-5" />, route: '/dashboard?page=products' },
    { id: 'orders', label: 'Orders', icon: <FiList className="w-5 h-5" />, route: '/dashboard?page=orders' },
    { id: 'customers', label: 'Customers', icon: <FiUsers className="w-5 h-5" />, route: '/dashboard?page=customers' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(admin?.role || '');
  });

  const handleNavigate = (route: string, pageId: string) => {
    if (isAdminDashboard) {
      router.push(route);
    } else {
      onPageChange?.(pageId);
    }
  };

  const handleLogout = () => {
    if (isAdminDashboard) {
      logoutAdmin?.();
    } else {
      logout?.();
    }
  };

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
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.route, item.id)}
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
          onClick={handleLogout}
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
