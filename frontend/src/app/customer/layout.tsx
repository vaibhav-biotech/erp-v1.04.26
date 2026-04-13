'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { customerAuthenticated, customerLoading } = useAuth();

  useEffect(() => {
    if (!customerLoading && !customerAuthenticated) {
      router.push('/auth/login');
    }
  }, [customerAuthenticated, customerLoading, router]);

  if (customerLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-montserrat text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!customerAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicNavbar />
      <main className="flex-1 pt-20 px-4 md:px-8">{children}</main>
      <PublicFooter />
    </div>
  );
}
