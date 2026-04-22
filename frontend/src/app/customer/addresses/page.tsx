'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function AddressesPage() {
  const { customer } = useAuth();

  const sampleAddresses = [
    {
      id: 1,
      type: 'Home',
      street: '123 Garden Lane',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      phone: '+91 9876543210',
      isDefault: true,
    },
    {
      id: 2,
      type: 'Office',
      street: '456 Plant Street',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      phone: '+91 9876543211',
      isDefault: false,
    },
  ];

  return (
    <div className="min-h-screen  py-8">
        <div className="max-w-4xl mx-auto px-4 text-black">
          {/* Header */}
          Welcome to the Addresses page
        </div>
      </div>
      
  );
}
