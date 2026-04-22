'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PublicFooter from '@/components/PublicFooter';

export default function SettingsPage() {
  const router = useRouter();
  const { customer, logoutCustomer } = useAuth();

  const handleLogout = () => {
    logoutCustomer();
    router.push('/');
  };

  return (
    <div className="min-h-screen  py-8">
        <div className="max-w-4xl mx-auto px-4 text-black">
          {/* Header */}
          Welcome to the Setings page
        </div>
      </div>
      
      
  );
}
