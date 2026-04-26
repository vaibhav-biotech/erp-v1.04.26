'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface CustomerOrder {
  _id: string;
  orderNumber?: string;
  orderId?: string;
  total: number;
  orderStatus?: string;
  status?: string;
  paymentStatus?: string;
  createdAt: string;
  items?: Array<{ quantity: number }>;
}

export default function CustomerDashboard() {
  const { customer, customerToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  const tabs = ['profile', 'orders', 'address', 'wishlist', 'settings'];

  const tabLabels: Record<string, string> = {
    profile: 'Profile',
    orders: 'Orders',
    address: 'Address',
    wishlist: 'Wishlist',
    settings: 'Settings',
  };

  const formatLabel = (value: string) =>
    String(value || '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const getStatusBadge = (status: string) => {
    switch (String(status || '').toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'shipped':
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
      case 'confirmed':
      case 'packed':
        return 'bg-amber-100 text-amber-700';
      case 'cancelled':
      case 'returned':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/customer?tab=${tab}`);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      if (!customer?._id || !customerToken || activeTab !== 'orders') return;

      try {
        setOrdersLoading(true);
        setOrdersError('');

        const response = await fetch(buildApiUrl(`/api/orders/customer/${customer._id}`), {
          headers: getApiHeaders(customerToken),
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || 'Failed to fetch orders');
        }

        setOrders(payload.data || []);
      } catch (error: any) {
        setOrdersError(error.message || 'Error loading orders');
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab, customer?._id, customerToken]);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => {
    const s = String(o.orderStatus || o.status || 'pending').toLowerCase();
    return ['pending', 'confirmed', 'processing', 'packed'].includes(s);
  }).length;
  const deliveredOrders = orders.filter((o) => String(o.orderStatus || o.status || '').toLowerCase() === 'delivered').length;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-playfair text-gray-900">
                    {`${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'My Profile'}
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">{customer?.email || '-'}</p>
                  <p className="text-gray-500 text-sm">{customer?.phone || '-'}</p>
                </div>
                <button className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm w-full sm:w-auto">
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalOrders}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-amber-700 mt-1">{pendingOrders}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Delivered</p>
                <p className="text-2xl font-bold text-green-700 mt-1">{deliveredOrders}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-gray-500">Wishlist</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">First Name</label>
                  <p className="text-base text-gray-900">{customer?.firstName || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Last Name</label>
                  <p className="text-base text-gray-900">{customer?.lastName || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Email</label>
                  <p className="text-base text-gray-900 break-all">{customer?.email || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Phone</label>
                  <p className="text-base text-gray-900">{customer?.phone || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Account ID</label>
                  <p className="text-sm text-gray-900 font-mono break-all">{customer?._id || '-'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 block mb-1">Store</label>
                  <p className="text-base text-gray-900">{customer?.store || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-playfair text-gray-900">My Orders</h2>
            {ordersLoading ? (
              <p className="text-gray-600">Loading your orders...</p>
            ) : ordersError ? (
              <p className="text-red-600">{ordersError}</p>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <p className="text-gray-800 mb-4">No orders yet, {customer?.firstName}. Start shopping to place your first order.</p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const normalizedStatus = order.orderStatus || order.status || 'pending';
                  const itemsCount = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;

                  return (
                    <div key={order._id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Order ID</p>
                        <p className="text-gray-900 font-semibold mt-1">{order.orderNumber || order.orderId || order._id}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')} • {itemsCount} items • Payment {formatLabel(order.paymentStatus || 'pending')}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(normalizedStatus)}`}>
                          {formatLabel(normalizedStatus)}
                        </span>
                        <p className="text-gray-900 font-semibold">₹{Number(order.total || 0).toLocaleString('en-IN')}</p>
                        <Link
                          href={`/customer/orders/${order._id}`}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'address':
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-playfair text-gray-900 mb-4">My Address</h2>
            <p className="text-gray-700">Welcome to your address page, {customer?.firstName}. Manage your delivery addresses here.</p>
          </div>
        );
      case 'wishlist':
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-playfair text-gray-900 mb-4">My Wishlist</h2>
            <p className="text-gray-700">Welcome to your wishlist, {customer?.firstName}. Your saved plants will appear here.</p>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-playfair text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-700">Welcome to your settings page, {customer?.firstName}. Manage your account preferences here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-4 sm:py-6 lg:py-8 bg-gray-50 min-h-screen text-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Mobile: horizontal tab bar */}
        <div className="lg:hidden mb-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-x-auto">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex-1 py-3 px-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab
                      ? 'border-green-600 text-green-700 bg-green-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">{renderContent()}</div>
        </div>

        {/* Desktop: two-column sidebar + content */}
        <div className="hidden lg:flex gap-6 items-start">
          <aside className="w-56 xl:w-64 shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 sticky top-24 shadow-sm">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`w-full text-left px-4 py-3 mb-1 last:mb-0 rounded-xl transition-all text-sm font-medium ${
                    activeTab === tab
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              ))}
            </div>
          </aside>
          <main className="flex-1 min-w-0">{renderContent()}</main>
        </div>

      </div>
    </div>
  );
}
