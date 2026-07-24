'use client';

import dynamic from 'next/dynamic';
import { CartProvider } from '@/contexts/CartContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChatProvider } from '@/contexts/ChatContext';
import { GlobalChatWidget } from '@/components/chat/GlobalChatWidget';

const CartModal = dynamic(() => import('@/components/CartModal'), { ssr: false });

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        <CartProvider>
          {children}
          <CartModal />
        </CartProvider>
        <GlobalChatWidget />
      </ChatProvider>
    </AuthProvider>
  );
}
