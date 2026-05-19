'use client';

import React, { useMemo, useState } from 'react';
import type { ParsedProduct } from '@/utils/parseExcelFile';

function truncate(text: string | undefined, max = 48): string {
  if (!text) return '—';
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max)}…`;
}

function formatVariants(product: ParsedProduct): string {
  if (!product.sizeVariants?.length) return '—';
  return product.sizeVariants
    .map((v) => `${v.name}:${v.originalPrice ?? v.price}`)
    .join(', ');
}

function formatVariantPrices(product: ParsedProduct): string {
  if (!product.sizeVariants?.length) return '—';
  return product.sizeVariants.map((v) => v.originalPrice ?? v.price).join(', ');
}

const COLUMNS: { key: string; label: string; width?: string; render: (p: ParsedProduct, i: number) => React.ReactNode }[] = [
  {
    key: 'row',
    label: '#',
    width: 'w-10',
    render: (_, i) => i + 1,
  },
  {
    key: 'images',
    label: 'Images Link',
    width: 'min-w-[140px]',
    render: (p) => (
      <span title={p.images.join('\n')}>
        {p.images.length} link{p.images.length !== 1 ? 's' : ''}
        {p.images[0] ? ` · ${truncate(p.images[0], 28)}` : ''}
      </span>
    ),
  },
  {
    key: 'name',
    label: 'Names',
    width: 'min-w-[120px]',
    render: (p) => <span className="font-medium">{p.name}</span>,
  },
  { key: 'category', label: 'Category', width: 'min-w-[90px]', render: (p) => p.category },
  { key: 'subcategory', label: 'Subcategory', width: 'min-w-[100px]', render: (p) => p.subcategory },
  {
    key: 'tags',
    label: 'Tags',
    width: 'min-w-[120px]',
    render: (p) => truncate((p.tags || []).join(', '), 40),
  },
  {
    key: 'description',
    label: 'Description',
    width: 'min-w-[160px]',
    render: (p) => <span title={p.description}>{truncate(p.description, 56)}</span>,
  },
  {
    key: 'benefits',
    label: 'Benefits',
    width: 'min-w-[140px]',
    render: (p) => <span title={p.benefits}>{truncate(p.benefits, 40)}</span>,
  },
  {
    key: 'care',
    label: 'Care',
    width: 'min-w-[140px]',
    render: (p) => <span title={p.care}>{truncate(p.care, 40)}</span>,
  },
  {
    key: 'stock',
    label: 'Stock',
    width: 'w-16',
    render: (p) => (p.stock != null ? p.stock : '—'),
  },
  {
    key: 'sizeVariants',
    label: 'Size Variants',
    width: 'min-w-[160px]',
    render: (p) => <span title={formatVariants(p)}>{truncate(formatVariants(p), 44)}</span>,
  },
  {
    key: 'sizePrices',
    label: 'Size Original Prices',
    width: 'min-w-[120px]',
    render: (p) => formatVariantPrices(p),
  },
  {
    key: 'originalPrice',
    label: 'Original Price',
    width: 'w-24',
    render: (p) => `₹${p.originalPrice}`,
  },
  {
    key: 'finalPrice',
    label: 'Final Price',
    width: 'w-24',
    render: (p) => `₹${p.finalPrice}`,
  },
  {
    key: 'discount',
    label: 'Discount',
    width: 'w-20',
    render: (p) => (p.discount != null ? `${p.discount}%` : '0%'),
  },
  { key: 'rating', label: 'Rating', width: 'w-16', render: (p) => p.rating },
  {
    key: 'status',
    label: 'Status',
    width: 'w-20',
    render: (p) => (
      <span
        className={`px-1.5 py-0.5 rounded text-xs font-medium ${
          p.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {p.status}
      </span>
    ),
  },
  { key: 'reviews', label: 'Reviews', width: 'w-20', render: (p) => p.reviews },
];

interface BulkUploadPreviewTableProps {
  products: ParsedProduct[];
}

export default function BulkUploadPreviewTable({ products }: BulkUploadPreviewTableProps) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const pageProducts = useMemo(
    () => products.slice(page * pageSize, page * pageSize + pageSize),
    [products, page]
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Scroll horizontally to see all {COLUMNS.length} columns · hover cells for full text
      </p>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[min(52vh,480px)] overflow-y-auto">
          <table className="text-xs border-collapse w-max min-w-full">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={`px-2 py-2 text-left font-semibold text-gray-700 border-b border-gray-200 whitespace-nowrap ${col.width || ''}`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-2 py-2 border-b border-gray-200 w-16 sticky right-0 bg-gray-100">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {pageProducts.map((product, idx) => {
                const rowIndex = page * pageSize + idx;
                const isOpen = expandedRow === rowIndex;
                return (
                  <React.Fragment key={rowIndex}>
                    <tr
                      className={`border-b border-gray-100 ${isOpen ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={`px-2 py-2 align-top text-gray-800 whitespace-nowrap ${col.width || ''}`}
                        >
                          {col.render(product, rowIndex)}
                        </td>
                      ))}
                      <td className="px-2 py-2 sticky right-0 bg-inherit">
                        <button
                          type="button"
                          onClick={() => setExpandedRow(isOpen ? null : rowIndex)}
                          className="text-blue-600 hover:underline font-medium"
                        >
                          {isOpen ? 'Hide' : 'View'}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr key={`${rowIndex}-detail`} className="bg-blue-50/80 border-b border-gray-200">
                        <td colSpan={COLUMNS.length + 1} className="px-4 py-3 text-xs text-gray-700 space-y-2">
                          <p>
                            <span className="font-semibold">Images:</span>{' '}
                            {product.images.join(' · ') || '—'}
                          </p>
                          <p>
                            <span className="font-semibold">Description:</span>{' '}
                            {product.description || '—'}
                          </p>
                          <p>
                            <span className="font-semibold">Benefits:</span>{' '}
                            {product.benefits || '—'}
                          </p>
                          <p>
                            <span className="font-semibold">Care:</span> {product.care || '—'}
                          </p>
                          <p>
                            <span className="font-semibold">Tags:</span>{' '}
                            {(product.tags || []).join(', ') || '—'}
                          </p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {products.length > pageSize && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, products.length)} of{' '}
            {products.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-gray-600">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
