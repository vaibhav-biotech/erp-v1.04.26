'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWithStore } from '@/lib/storeConfig';
import {
  FiHome,
  FiPackage,
  FiShoppingCart,
  FiActivity,
  FiList,
  FiUsers,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiSettings,
  FiChevronDown,
  FiTruck,
  FiBarChart2,
  FiTrendingUp,
} from 'react-icons/fi';

interface Category {
  _id: string;
  name: string;
  slug: string;
}

interface SidebarGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  isCollapsible: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  route: string;
  roles?: string[];
}

export default function GroupedSidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const isProductDetailsPage = pathname?.includes('/products/');
  const currentPage = isProductDetailsPage ? 'products' : (searchParams.get('page') || 'home');
  const currentCategory = searchParams.get('category') || '';
  
  const { logout, logoutAdmin, adminAuthenticated, admin, adminToken } = useAuth();

  // Fetch categories on mount
  useEffect(() => {
    if (adminAuthenticated && (admin?.role === 'store_admin' || admin?.role === 'inventory_admin') && adminToken) {
      fetchCategories();
    }
  }, [adminAuthenticated, admin, adminToken]);

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await fetchWithStore('/api/categories', {
        token: adminToken || undefined,
      });
      
      if (response.ok) {
        const data = await response.json();
        const cats = Array.isArray(data?.data) ? data.data : [];
        setCategories(cats);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleNavigate = (route: string) => {
    router.push(route);
  };

  const handleLogout = () => {
    logoutAdmin?.();
  };

  // Product management items - just the categories
  const productItems: MenuItem[] = categories.map((cat) => ({
    id: `category-${cat._id}`,
    label: cat.name,
    route: admin?.role === 'inventory_admin'
      ? `/inventory?page=products&category=${cat._id}&categoryName=${encodeURIComponent(cat.name)}`
      : `/admin/dashboard/store-admin?page=products&category=${cat._id}&categoryName=${encodeURIComponent(cat.name)}`,
    roles: ['store_admin', 'inventory_admin'],
  }));

  // Settings/Website items
  const settingsItems: MenuItem[] = [
    {
      id: 'website-settings',
      label: 'Website Settings',
      route: '/admin/dashboard/store-admin?page=website-settings',
      roles: ['store_admin'],
    },
    {
      id: 'notification-bar',
      label: 'Notification Bar',
      route: '/admin/dashboard/store-admin?page=notification-bar',
      roles: ['store_admin'],
    },
    {
      id: 'category-section',
      label: 'Category Section',
      route: '/admin/dashboard/store-admin?page=category-section',
      roles: ['store_admin'],
    },
    {
      id: 'featured-collections',
      label: 'Featured Collections',
      route: '/admin/dashboard/store-admin?page=featured-collections',
      roles: ['store_admin'],
    },
    {
      id: 'gift-wrap',
      label: 'Gift Wrap Options',
      route: '/admin/dashboard/store-admin?page=gift-wrap',
      roles: ['store_admin'],
    },
    {
      id: 'gift-section',
      label: 'Gift Section',
      route: '/admin/dashboard/store-admin?page=gift-section',
      roles: ['store_admin'],
    },
    {
      id: 'care-section',
      label: 'Care Section',
      route: '/admin/dashboard/store-admin?page=care-section',
      roles: ['store_admin'],
    },
    {
      id: 'landing',
      label: 'Landing Page',
      route: '/admin/dashboard/store-admin?page=landing',
      roles: ['store_admin'],
    },
    {
      id: 'offers',
      label: 'Offers',
      route: '/admin/dashboard/store-admin?page=offers',
      roles: ['store_admin'],
    },
  ];

  // Top-level navigation items
  const topLevelItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Dashboard',
      icon: <FiHome className="w-5 h-5" />,
      route: admin?.role === 'super_admin' ? '/superadmin' : (admin?.role === 'inventory_admin' ? '/inventory' : (admin?.role === 'accountant' ? '/accounts' : '/admin/dashboard/store-admin')),
      roles: ['store_admin', 'inventory_admin', 'super_admin', 'accountant'],
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: <FiPackage className="w-5 h-5" />,
      route: '/inventory?page=inventory',
      roles: ['inventory_admin'],
    },
    {
      id: 'purchase-orders',
      label: 'Purchase Orders',
      icon: <FiShoppingCart className="w-5 h-5" />,
      route: '/accounts?page=purchase-orders',
      roles: ['accountant', 'super_admin'],
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      icon: <FiTruck className="w-5 h-5" />,
      route: '/accounts?page=suppliers',
      roles: ['accountant', 'super_admin'],
    },

    {
      id: 'accounts-orders',
      label: 'Store Orders',
      icon: <FiList className="w-5 h-5" />,
      route: '/accounts?page=accounts-orders',
      roles: ['accountant', 'super_admin'],
    },
    {
      id: 'accounts-invoices',
      label: 'Invoices',
      icon: <FiList className="w-5 h-5" />,
      route: '/accounts?page=accounts-invoices',
      roles: ['accountant', 'super_admin'],
    },
    {
      id: 'activity-log',
      label: 'Activity Logs',
      icon: <FiActivity className="w-5 h-5" />,
      route: '/inventory?page=activity-log',
      roles: ['inventory_admin'],
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: <FiPackage className="w-5 h-5" />,
      route: admin?.role === 'inventory_admin' ? '/inventory?page=categories' : '/admin/dashboard/store-admin?page=categories',
      roles: ['store_admin', 'inventory_admin'],
    },
    {
      id: 'orders',
      label: 'Orders',
      icon: <FiList className="w-5 h-5" />,
      route: '/admin/dashboard/store-admin?page=orders',
      roles: ['store_admin'],
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <FiUsers className="w-5 h-5" />,
      route: '/admin/dashboard/store-admin?page=customers',
      roles: ['store_admin'],
    },
    // ---- SUPER ADMIN ITEMS ----
    {
      id: 'super-stores',
      label: 'Stores',
      icon: <FiShoppingCart className="w-5 h-5" />,
      route: '/superadmin?page=manage-stores',
      roles: ['super_admin'],
    },
    {
      id: 'super-orders',
      label: 'Orders',
      icon: <FiShoppingCart className="w-5 h-5" />,
      route: '/superadmin?page=all-orders',
      roles: ['super_admin'],
    },
    {
      id: 'super-customers',
      label: 'Customers',
      icon: <FiUsers className="w-5 h-5" />,
      route: '/superadmin?page=all-customers',
      roles: ['super_admin'],
    },
    {
      id: 'super-products',
      label: 'Products',
      icon: <FiPackage className="w-5 h-5" />,
      route: '/superadmin?page=products',
      roles: ['super_admin'],
    },
    {
      id: 'super-inventory',
      label: 'Inventory',
      icon: <FiPackage className="w-5 h-5" />,
      route: '/superadmin?page=inventory',
      roles: ['super_admin'],
    },
    {
      id: 'super-finance',
      label: 'Finance',
      icon: <FiBarChart2 className="w-5 h-5" />,
      route: '/superadmin?page=finance',
      roles: ['super_admin'],
    },
    {
      id: 'super-replysys',
      label: 'ReplySys',
      icon: <FiActivity className="w-5 h-5" />,
      route: '/superadmin?page=replysys',
      roles: ['super_admin'],
    },
    {
      id: 'super-staff',
      label: 'Staff',
      icon: <FiUsers className="w-5 h-5" />,
      route: '/superadmin?page=manage-staff',
      roles: ['super_admin'],
    },
    {
      id: 'super-analytics',
      label: 'Analytics',
      icon: <FiTrendingUp className="w-5 h-5" />,
      route: '/superadmin?page=analytics',
      roles: ['super_admin'],
    },
    {
      id: 'super-reports',
      label: 'Reports',
      icon: <FiList className="w-5 h-5" />,
      route: '/superadmin?page=reports',
      roles: ['super_admin'],
    },
    {
      id: 'super-settings',
      label: 'Settings',
      icon: <FiSettings className="w-5 h-5" />,
      route: '/superadmin?page=settings',
      roles: ['super_admin'],
    },
  ];

  const groups: SidebarGroup[] = [
    {
      id: 'products',
      label: 'Products',
      icon: <FiShoppingCart className="w-5 h-5" />,
      items: productItems,
      isCollapsible: true,
    },
    {
      id: 'settings',
      label: 'Website Settings',
      icon: <FiSettings className="w-5 h-5" />,
      items: settingsItems.filter(item => item.roles?.includes(admin?.role || '')),
      isCollapsible: true,
    },
    {
      id: 'account',
      label: 'Account',
      icon: <FiPackage className="w-5 h-5" />,
      items: [
        {
          id: 'account-tax',
          label: 'Tax Settings',
          route: '/admin/dashboard/store-admin?page=account-tax',
          roles: ['store_admin'],
        },
      ].filter(item => item.roles?.includes(admin?.role || '')),
      isCollapsible: true,
    },
  ];

  // Filter out groups that have 0 items due to role restrictions
  const filteredGroups = groups.filter(g => g.items.length > 0);

  const isActive = (itemId: string, itemRoute: string): boolean => {
    if (itemId === 'home' && currentPage !== 'home') return false;
    if (itemRoute.includes('?page=')) {
      const params = new URLSearchParams(itemRoute.split('?')[1]);
      const pageParam = params.get('page');
      const categoryParam = params.get('category');

      if (categoryParam) {
        return currentPage === pageParam && currentCategory === categoryParam;
      }

      return currentPage === pageParam && !currentCategory;
    }
    return currentPage === itemId;
  };

  return (
    <div
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-white border-r border-gray-200 transition-all duration-300 h-screen max-h-screen flex flex-col z-50 overflow-hidden`}
    >
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200 flex items-center justify-between">
        {isOpen && <h1 className="text-xl font-bold text-black">🌿 Menu</h1>}
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
      <nav
        className="flex-1 min-h-0 p-4 space-y-2 overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Top-level items */}
        {topLevelItems.filter(item => item.roles?.includes(admin?.role || '')).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.route)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive(item.id, item.route)
                ? 'bg-blue-100 text-blue-700 font-semibold border-l-4 border-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={!isOpen ? item.label : ''}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {isOpen && <span>{item.label}</span>}
          </button>
        ))}

        {/* Grouped sections */}
        {filteredGroups.map((group) => (
          <div key={group.id} className="py-2">
            {/* Group header - collapsible */}
            <button
              onClick={() => toggleGroup(group.id)}
              className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 ${
                expandedGroups.has(group.id)
                  ? 'bg-gray-50 text-gray-900 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={!isOpen ? group.label : ''}
            >
              <span className="flex-shrink-0">{group.icon}</span>
              {isOpen && (
                <>
                  <span className="flex-1 text-left">{group.label}</span>
                  <FiChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      expandedGroups.has(group.id) ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </>
              )}
            </button>

            {/* Group items - expandable */}
            {isOpen && expandedGroups.has(group.id) && (
              <div className="mt-1 space-y-0.5 pl-4">
                {loadingCategories && group.id === 'products' ? (
                  <div className="px-4 py-2.5 text-sm text-gray-400">
                    Loading...
                  </div>
                ) : group.items.length === 0 ? (
                  <div className="px-4 py-2.5 text-sm text-gray-400">
                    No items
                  </div>
                ) : (
                  group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigate(item.route)}
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-all duration-200 ${
                        isActive(item.id, item.route)
                          ? 'text-gray-900 font-semibold bg-gray-100'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                      <span>{item.label}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
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
