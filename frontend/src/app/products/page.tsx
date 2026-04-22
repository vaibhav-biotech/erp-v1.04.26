'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';

export default function ProductsPage() {
  const router = useRouter();

  // Redirect to first category
  React.useEffect(() => {
    router.push('/products/plants');
  }, [router]);

  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-montserrat text-gray-600">Redirecting...</p>
      </div>
      <PublicFooter />
    </>
  );
}
