'use client';

import { useSearchParams } from 'next/navigation';

export default function Topbar() {
  const searchParams = useSearchParams();
  const page = searchParams.get('page') || 'dashboard';

  const formatTitle = (pageStr: string) => {
    // Basic mapping
    const titleMap: Record<string, string> = {
      'dashboard': 'Dashboard Overview',
      'inventory': 'Inventory Management',
      'products': 'Product Catalog',
      'orders': 'Orders & Fulfillment',
      'customers': 'Customer Directory',
      'staff': 'Staff Management',
      'categories': 'Categories',
      'suppliers': 'Suppliers Management',
      'purchase-orders': 'Purchase Orders'
    };

    return titleMap[pageStr] || pageStr.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const title = formatTitle(page);

  return (
    <div className="w-full flex flex-row items-center justify-between">
      <div className="flex flex-col">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full whitespace-nowrap">
          🌿 Plants In Garden
        </div>
      </div>
    </div>
  );
}
