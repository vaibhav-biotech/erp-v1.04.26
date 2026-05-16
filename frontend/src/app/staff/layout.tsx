'use client';

import { usePathname } from 'next/navigation';
import StaffDashboardLayout from '@/components/staff/StaffDashboardLayout';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/staff/login';

  if (isLogin) {
    return <>{children}</>;
  }

  return <StaffDashboardLayout>{children}</StaffDashboardLayout>;
}
