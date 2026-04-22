'use client';

import { Suspense } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-600">Loading dashboard...</div>}>
      <DashboardLayout />
    </Suspense>
  );
}
