'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { getApiHeaders, buildApiUrl } from '@/lib/storeConfig';
import PublicNavbar from '@/components/PublicNavbar';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
    showPassword: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (form.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to reset password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8F3E6] rounded-3xl shadow-xl w-full max-w-md p-8 border border-[#E8DFC9] mx-auto mt-20">
      <div className="text-center mb-8">
        <h2 className="font-playfair italic text-3xl font-bold text-[#6B4E0F] mb-2">
          Reset Password
        </h2>
        <p className="text-[#8B6508] text-sm italic font-playfair">
          Enter your new password below
        </p>
      </div>

      {success ? (
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
            <p className="font-montserrat text-green-700 font-medium">
              Password has been successfully reset!
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-[#8B6508] text-white py-3.5 rounded-xl font-playfair italic font-bold hover:bg-[#6E5006] transition-all duration-300 text-lg shadow-md"
          >
            Return to Home & Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={form.showPassword ? 'text' : 'password'}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 bg-[#FFFDF9] border border-[#D4C3A3] rounded-xl font-montserrat focus:outline-none focus:border-[#8B6508] focus:ring-1 focus:ring-[#8B6508] transition-all duration-300 placeholder:text-[#C5B393] text-[#5C4033]"
              />
              <button
                type="button"
                onClick={() => setForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                className="absolute right-3 top-2.5 text-[#8B6508] hover:text-[#5C4033] transition-colors"
              >
                {form.showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-playfair italic font-bold text-sm text-[#6B4E0F] mb-1.5">Confirm New Password</label>
            <input
              type={form.showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
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
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] flex flex-col">
      <PublicNavbar />
      <div className="flex-1 flex flex-col justify-center px-4 py-12">
        <Suspense fallback={
          <div className="text-center mt-20 font-playfair italic text-[#8B6508]">
            Loading...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
