'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginCustomer, registerCustomer, customerAuthenticated } = useAuth();
  const redirectPath = searchParams.get('redirect') || '/customer';
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customerAuthenticated) {
      router.replace(redirectPath);
    }
  }, [customerAuthenticated, redirectPath, router]);

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    showPassword: false,
  });

  // Signup form
  const [signupForm, setSignupForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    showPassword: false,
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!loginForm.email || !loginForm.password) {
        setError('Email and password required');
        setLoading(false);
        return;
      }

      await loginCustomer(loginForm.email, loginForm.password);
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!signupForm.firstName || !signupForm.lastName || !signupForm.email || !signupForm.phone || !signupForm.password) {
        setError('All fields required');
        setLoading(false);
        return;
      }

      if (signupForm.password !== signupForm.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (signupForm.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (!/^\d{10}$/.test(signupForm.phone)) {
        setError('Phone must be 10 digits');
        setLoading(false);
        return;
      }

      if (signupForm.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (signupForm.password !== signupForm.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      await registerCustomer({
        email: signupForm.email,
        password: signupForm.password,
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        phone: signupForm.phone,
      });

      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-center md:text-left"
          >
            <div className="mb-8">
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-black mb-4">
                🌱 Plants In Garden
              </h1>
              <p className="text-gray-600 text-lg">Your perfect plant companion</p>
            </div>

            <div className="hidden md:block space-y-6 text-gray-700">
              <div className="flex gap-4">
                <div className="text-2xl">🪴</div>
                <div>
                  <h3 className="font-montserrat font-bold text-black mb-1">Premium Plants</h3>
                  <p className="text-sm">Handpicked quality plants for your home</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl">📦</div>
                <div>
                  <h3 className="font-montserrat font-bold text-black mb-1">Fast Delivery</h3>
                  <p className="text-sm">Free shipping on orders above ₹60</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl">✅</div>
                <div>
                  <h3 className="font-montserrat font-bold text-black mb-1">Guaranteed Quality</h3>
                  <p className="text-sm">14-day replacement guarantee</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Forms */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {/* Mode Toggle */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 rounded-lg font-montserrat font-bold text-sm transition ${
                  mode === 'login'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-3 rounded-lg font-montserrat font-bold text-sm transition ${
                  mode === 'signup'
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login Form */}
            {mode === 'login' && (
              <motion.form onSubmit={handleLoginSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="block font-montserrat text-sm text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={loginForm.email}
                    onChange={handleLoginChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-montserrat text-sm text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={loginForm.showPassword ? 'text' : 'password'}
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => setLoginForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="absolute right-3 top-3 text-gray-600"
                    >
                      {loginForm.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="font-montserrat text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg font-montserrat font-bold hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </motion.form>
            )}

            {/* Signup Form */}
            {mode === 'signup' && (
              <motion.form onSubmit={handleSignupSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-montserrat text-sm text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={signupForm.firstName}
                      onChange={handleSignupChange}
                      placeholder="John"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                    />
                  </div>
                  <div>
                    <label className="block font-montserrat text-sm text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={signupForm.lastName}
                      onChange={handleSignupChange}
                      placeholder="Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-montserrat text-sm text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={signupForm.email}
                    onChange={handleSignupChange}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-montserrat text-sm text-gray-700 mb-2">Phone (10 digits)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={signupForm.phone}
                    onChange={handleSignupChange}
                    placeholder="9876543210"
                    maxLength={10}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block font-montserrat text-sm text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={signupForm.showPassword ? 'text' : 'password'}
                      name="password"
                      value={signupForm.password}
                      onChange={handleSignupChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => setSignupForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="absolute right-3 top-3 text-gray-600"
                    >
                      {signupForm.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-montserrat text-sm text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type={signupForm.showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={signupForm.confirmPassword}
                    onChange={handleSignupChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg font-montserrat focus:outline-none focus:border-black"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <p className="font-montserrat text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg font-montserrat font-bold hover:bg-gray-900 transition disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}
