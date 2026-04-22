'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const { admin, adminAuthenticated } = useAuth();

  // Route based on admin role
  useEffect(() => {
    if (!adminAuthenticated) {
      router.push('/admin');
    } else if (admin?.role === 'super_admin') {
      router.push('/admin/dashboard/super-admin');
    } else if (admin?.role === 'store_admin') {
      router.push('/admin/dashboard/store-admin');
    }
  }, [adminAuthenticated, admin, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
