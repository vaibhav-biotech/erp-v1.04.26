'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiPackage } from 'react-icons/fi';
import InventoryTable from '@/components/InventoryTable';

export default function InventoryReportsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <FiPackage className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="font-playfair text-3xl text-gray-900">Inventory Reports</h1>
          <p className="font-montserrat text-gray-500 mt-1">
            Centralized stock view and valuation.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8 overflow-hidden">
        <InventoryTable />
      </div>
    </motion.div>
  );
}
