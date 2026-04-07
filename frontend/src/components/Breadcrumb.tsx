'use client';

import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="px-4 sm:px-8 lg:px-16 py-2 sm:py-3">
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 overflow-x-auto">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            {item.href ? (
              <Link 
                href={item.href}
                className="hover:text-gray-900 transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium truncate">{item.label}</span>
            )}
            
            {index < items.length - 1 && (
              <span className="text-gray-400 flex-shrink-0">/</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
