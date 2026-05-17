'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginStaff } from '@/lib/staffAuth';

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
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white text-2xl flex items-center justify-center mx-auto mb-4">
            🌿
          </div>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Staff Folder</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Plants in Garden</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to manage your daily tasks</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
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
          <p className="text-gray-500 pt-1">
            Custom staff (e.g. demo2) must exist on the server — admin creates them under Team on production.
          </p>
        </div>
      </div>
    </div>
  );
}
