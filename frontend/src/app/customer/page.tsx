'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function CustomerDashboard() {
  const { customer } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = ['profile', 'orders', 'address', 'wishlist', 'settings'];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-playfair font-normal">My Profile</h2>
              <button className="px-6 py-2 border-2 border-black text-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium">
                Edit Profile
              </button>
            </div>

            <div className="border-t border-b border-gray-300 py-8">
              <div className="grid grid-cols-3 gap-8">
                {/* Column 1 */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">First Name</label>
                  <p className="text-lg text-black">{customer?.firstName || '-'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Last Name</label>
                  <p className="text-lg text-black">{customer?.lastName || '-'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Email</label>
                  <p className="text-lg text-black">{customer?.email || '-'}</p>
                </div>

                {/* Column 2 */}
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Phone</label>
                  <p className="text-lg text-black">{customer?.phone || '-'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Account ID</label>
                  <p className="text-lg text-black font-mono text-sm">{customer?._id || '-'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">Store</label>
                  <p className="text-lg text-black">{customer?.store || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div>
            <h2 className="text-2xl font-playfair font-normal mb-4">My Orders</h2>
            <p className="text-black">Welcome to your orders page, {customer?.firstName}. Your orders will appear here.</p>
          </div>
        );
      case 'address':
        return (
          <div>
            <h2 className="text-2xl font-playfair font-normal mb-4">My Address</h2>
            <p className="text-black">Welcome to your address page, {customer?.firstName}. Manage your delivery addresses here.</p>
          </div>
        );
      case 'wishlist':
        return (
          <div>
            <h2 className="text-2xl font-playfair font-normal mb-4">My Wishlist</h2>
            <p className="text-black">Welcome to your wishlist, {customer?.firstName}. Your saved plants will appear here.</p>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h2 className="text-2xl font-playfair font-normal mb-4">Settings</h2>
            <p className="text-black">Welcome to your settings page, {customer?.firstName}. Manage your account preferences here.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="py-8 text-black">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex gap-8">
          {/* Left Side - Small Menu Box */}
          <div className="w-48 bg-gray-100 rounded-lg p-4 h-fit">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-3 mb-2 rounded transition-all ${
                  activeTab === tab
                    ? 'bg-black text-white font-medium'
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                {tab === 'profile' && 'My Profile'}
                {tab === 'orders' && 'My Orders'}
                {tab === 'address' && 'Address'}
                {tab === 'wishlist' && 'Wishlist'}
                {tab === 'settings' && 'Settings'}
              </button>
            ))}
          </div>

          {/* Right Side - Content Area */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
}
