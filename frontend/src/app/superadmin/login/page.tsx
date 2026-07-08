'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { loginAdmin, adminAuthenticated, admin, logout } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminAuthenticated && admin) {
      if (admin.role === 'super_admin') {
        router.push('/superadmin');
      } else if (admin.role === 'inventory_admin') {
        router.push('/inventory');
      } else if (admin.role === 'accountant') {
        router.push('/accounts');
      } else if (admin.role === 'store_admin') {
        router.push('/admin/dashboard/store-admin');
      } else {
        router.push('/staff');
      }
    }
  }, [adminAuthenticated, admin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin(email, password);
      router.push('/superadmin');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
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
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Global Management</h2>
          <p className="text-purple-100 text-lg">
            Oversee all stores, managers, and global settings from the central superadmin command center.
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Superadmin Portal</h1>
            <p className="mt-2 text-gray-600">Sign in to your superadmin account</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="super@plantsmall.com"
                required
                disabled={loading}
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Test Credentials Info */}
            <div className="space-y-4">
              <div className="rounded-xl bg-purple-50 p-4 border border-purple-100">
                <p className="text-sm font-medium text-purple-900 mb-2">Test Credentials (Super Admin):</p>
                <div className="text-sm text-purple-800 space-y-1">
                  <p><strong>Email:</strong> super@plantsmall.com</p>
                  <p><strong>Password:</strong> SuperAdmin@123</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-purple-600 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
