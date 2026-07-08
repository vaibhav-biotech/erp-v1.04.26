'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AccountsLoginPage() {
  const router = useRouter();
  const { loginAdmin, adminAuthenticated, admin, logout } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (adminAuthenticated && admin) {
      if (admin.role === 'accountant' || admin.role === 'super_admin') {
        router.push('/accounts');
      } else if (admin.role === 'inventory_admin') {
        router.push('/inventory');
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
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"></div>
        <div className="max-w-md text-center space-y-6 relative z-10">
          <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm border border-white/20">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold tracking-tight">Accounts Portal</h2>
          <p className="text-gray-200 text-lg">
            Manage your store orders, invoices, purchase orders, and supplier payments in one centralized dashboard.
          </p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Accounts Portal</h1>
            <p className="mt-2 text-gray-600">Sign in to your accountant account</p>
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
                placeholder="accountant@vaibhav.com"
                required
                disabled={loading}
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
                className="mt-2 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            {/* Test Credentials Info */}
            <div className="space-y-4">
              <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                <p className="text-sm font-medium text-blue-900 mb-2">Test Credentials (Accounts Portal):</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>Accountant:</strong> accountant@vaibhav.com / password123</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-blue-600 font-medium">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
