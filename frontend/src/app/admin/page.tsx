'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginAdmin, adminAuthenticated, logout } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (adminAuthenticated) {
      router.push('/admin/dashboard');
    }
  }, [adminAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginAdmin(email, password);
      // Redirect to dashboard after successful login
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Sign in to your admin account</p>
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
              placeholder="admin@plantsmall.com"
              required
              disabled={loading}
              className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
              className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Test Credentials Info */}
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">Test Credentials:</p>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Super Admin:</strong> super@plantsmall.com / SuperAdmin@123</p>
              <p><strong>Store Admin:</strong> admin+plantsingarden@plantsmall.com / Store@123</p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
