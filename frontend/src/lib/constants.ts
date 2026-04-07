// Single source of truth for all enums and constants
export const CATEGORY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  OUT_OF_STOCK: 'out_of_stock',
} as const;

export const USER_ROLE = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  MODERATOR: 'moderator',
} as const;

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

// Status labels for UI
export const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
  out_of_stock: 'Out of Stock',
  admin: 'Admin',
  customer: 'Customer',
  moderator: 'Moderator',
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
} as const;

// Status colors for badges
export const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  archived: 'bg-yellow-100 text-yellow-800',
  out_of_stock: 'bg-red-100 text-red-800',
  admin: 'bg-blue-100 text-blue-800',
  customer: 'bg-purple-100 text-purple-800',
  moderator: 'bg-indigo-100 text-indigo-800',
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
} as const;
