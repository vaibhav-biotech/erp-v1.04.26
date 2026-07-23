'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getApiHeaders, buildApiUrl } from '@/lib/storeConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  redirectPath?: string;
}

export default function AuthModal({ isOpen, onClose, redirectPath = '/customer' }: AuthModalProps) {
  const router = useRouter();
  const { loginCustomer, registerCustomer } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  // Forgot password form
  const [forgotPasswordForm, setForgotPasswordForm] = useState({
    email: '',
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

  const handleForgotPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForgotPasswordForm(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMsg('');
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
      onClose();
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

      await registerCustomer({
        email: signupForm.email,
        password: signupForm.password,
        firstName: signupForm.firstName,
        lastName: signupForm.lastName,
        phone: signupForm.phone,
      });

      onClose();
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (!forgotPasswordForm.email) {
        setError('Email is required');
        setLoading(false);
        return;
      }

      const response = await fetch(buildApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email: forgotPasswordForm.email }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to send reset email');
      }

      setSuccessMsg('Reset link has been sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 backdrop-blur-sm p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-[#F8F3E6] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-[#E8DFC9]"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#8B6508] hover:text-[#5C4033] bg-[#E8DFC9]/50 hover:bg-[#E8DFC9] rounded-full p-2 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="font-playfair italic text-3xl font-bold text-[#6B4E0F] mb-2">
                  🌱 Welcome
                </h2>
                <p className="text-[#8B6508] text-sm italic font-playfair">Sign in or create an account</p>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-4 mb-8 bg-[#E8DFC9]/40 p-1.5 rounded-xl">
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2.5 rounded-lg font-playfair italic font-bold text-lg transition-all duration-300 ${
                    mode === 'login' || mode === 'forgot-password'
                      ? 'bg-[#8B6508] text-white shadow-md'
                      : 'text-[#8B6508] hover:text-[#5C4033]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                  className={`flex-1 py-2.5 rounded-lg font-playfair italic font-bold text-lg transition-all duration-300 ${
                    mode === 'signup'
                      ? 'bg-[#8B6508] text-white shadow-md'
                      : 'text-[#8B6508] hover:text-[#5C4033]'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Login Form */}
              {mode === 'login' && (
                <motion.form onSubmit={handleLoginSubmit} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div>
                    <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                    />
                  </div>

                  <div>
                    <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={loginForm.showPassword ? 'text' : 'password'}
                        name="password"
                        value={loginForm.password}
                        onChange={handleLoginChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                      />
                      <button
                        type="button"
                        onClick={() => setLoginForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute right-3 top-2.5 text-[#8B6508] hover:text-[#5C4033] transition-colors"
                      >
                        {loginForm.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    <div className="flex justify-end mt-2">
                      <button 
                        type="button" 
                        onClick={() => { setMode('forgot-password'); setError(''); }}
                        className="text-[#8B6508] hover:text-[#5C4033] text-sm font-playfair italic transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                      <p className="font-montserrat text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8B6508] text-white py-3.5 rounded-xl font-playfair italic font-bold hover:bg-[#6E5006] transition-all duration-300 disabled:opacity-50 mt-4 text-lg shadow-md"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </motion.form>
              )}

              {/* Forgot Password Form */}
              {mode === 'forgot-password' && (
                <motion.form onSubmit={handleForgotPasswordSubmit} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-[#6B4E0F] text-sm font-montserrat">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                  </div>
                  <div>
                    <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={forgotPasswordForm.email}
                      onChange={handleForgotPasswordChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                      <p className="font-montserrat text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  
                  {successMsg && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl">
                      <p className="font-montserrat text-sm text-green-700">{successMsg}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8B6508] text-white py-3.5 rounded-xl font-playfair italic font-bold hover:bg-[#6E5006] transition-all duration-300 disabled:opacity-50 mt-4 text-lg shadow-md"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  
                  <div className="text-center mt-4">
                    <button 
                      type="button"
                      onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
                      className="text-[#8B6508] hover:text-[#5C4033] text-sm font-playfair italic transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Signup Form */}
              {mode === 'signup' && (
                <motion.form onSubmit={handleSignupSubmit} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        value={signupForm.firstName}
                        onChange={handleSignupChange}
                        placeholder="John"
                        className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                      />
                    </div>
                    <div>
                      <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={signupForm.lastName}
                        onChange={handleSignupChange}
                        placeholder="Doe"
                        className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={signupForm.email}
                      onChange={handleSignupChange}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                    />
                  </div>

                  <div>
                    <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Phone (10 digits)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={signupForm.phone}
                      onChange={handleSignupChange}
                      placeholder="9876543210"
                      maxLength={10}
                      className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                    />
                  </div>

                  <div>
                    <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={signupForm.showPassword ? 'text' : 'password'}
                        name="password"
                        value={signupForm.password}
                        onChange={handleSignupChange}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                      />
                      <button
                        type="button"
                        onClick={() => setSignupForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                        className="absolute right-3 top-2.5 text-[#8B6508] hover:text-[#5C4033] transition-colors"
                      >
                        {signupForm.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Confirm Password</label>
                    <input
                      type={signupForm.showPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={signupForm.confirmPassword}
                      onChange={handleSignupChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
                      <p className="font-montserrat text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#8B6508] text-white py-3.5 rounded-xl font-playfair italic font-bold hover:bg-[#6E5006] transition-all duration-300 disabled:opacity-50 mt-4 text-lg shadow-md"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </motion.form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
