'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function ProfilePage() {
  const { customer } = useAuth();

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Edit Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-playfair font-normal">My Profile</h1>
          <button className="px-6 py-2 border-2 border-black text-black rounded-lg hover:bg-black hover:text-white transition-colors font-medium">
            Edit Profile
          </button>
        </div>

        {/* Customer Details - 3 Column Grid */}
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
              <label className="text-sm font-medium text-gray-600 block mb-2">Email Verified</label>
              <p className="text-lg text-black">{customer?.isEmailVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
