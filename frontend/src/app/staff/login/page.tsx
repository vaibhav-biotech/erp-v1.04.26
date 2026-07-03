'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginStaff } from '@/lib/staffAuth';
import Link from 'next/link';

export default function StaffLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await loginStaff(loginId, password);
    setLoading(false);
    if (!result.ok) {
      setError(
        result.inactive
          ? 'This account is inactive. Contact your admin.'
          : result.error
      );
      return;
    }
    router.push('/staff');
  };

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Left Column - Visuals */}
      <div 
        className="hidden lg:flex w-1/2 flex-col items-center justify-center text-white p-12 relative bg-cover bg-center transition-all duration-1000"
        style={{ backgroundImage: `url('https://plants-mall-website.s3.ap-southeast-2.amazonaws.com/products/1779692487018-8d425e4b-c33c-47ac-9138-759bf30adfd1.jpg')` }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"></div>
        <div className="max-w-md text-center space-y-6 relative z-10">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20">
            <span className="text-5xl">🌿</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Staff Management Portal</h2>
          <p className="text-gray-300 text-lg">
            Manage your daily tasks, handle customer communications, and update attendance from one central hub.
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Staff Folder</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">Sign in to portal</h1>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username or email</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="priya or staff@plantsingarden.com"
                required
                autoComplete="username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="••••••••"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl py-3.5 text-base transition-colors disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600 space-y-2">
            <p className="font-semibold text-gray-800">Demo accounts</p>
            <p><span className="font-medium">Staff:</span> priya or staff@plantsingarden.com / staff123</p>
            <p><span className="font-medium">Admin:</span> admin or admin@plantsingarden.com / admin123</p>
          </div>
          
          {/* Footer Links */}
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
