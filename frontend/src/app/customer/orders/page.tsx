'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer?tab=orders');
  }, [router]);

  return (
    <div className="py-12 text-center text-gray-600">Redirecting to My Account...</div>
  );
}
