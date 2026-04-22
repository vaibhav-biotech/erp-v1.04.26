'use client';

import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function OrdersPage() {
  const { customer } = useAuth();

  const sampleOrders = [
    {
      id: 'ORD-001',
      date: '2025-04-10',
      items: 3,
      total: 1250,
      status: 'Delivered',
      statusColor: 'green',
    },
    {
      id: 'ORD-002',
      date: '2025-04-05',
      items: 2,
      total: 890,
      status: 'Delivered',
      statusColor: 'green',
    },
    {
      id: 'ORD-003',
      date: '2025-03-28',
      items: 5,
      total: 2100,
      status: 'Processing',
      statusColor: 'blue',
    },
  ];

  return (
    <div className="min-h-screen  py-8">
        <div className="max-w-4xl mx-auto px-4 text-black">
          {/* Header */}
          Welcome to the Orders page
        </div>
      </div>
      
  );
}
