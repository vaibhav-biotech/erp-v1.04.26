'use client';

import { useRouter } from 'next/navigation';

export default function Topbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/auth/login');
  };

  return (
    <div className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 fixed top-0 right-0 left-64 transition-all duration-300 z-40">
      <div className="text-xl font-bold text-black">
        🌿 Plants In Garden
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600">
          Welcome back!
        </div>
      </div>
    </div>
  );
}
