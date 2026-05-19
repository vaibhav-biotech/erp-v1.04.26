'use client';

import dynamic from 'next/dynamic';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';

const CartModal = dynamic(() => import('@/components/CartModal'), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {children}
        <CartModal />
      </CartProvider>
    </AuthProvider>
  );
}
