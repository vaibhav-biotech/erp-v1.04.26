'use client';

import { useState } from 'react';
import { createStaffMember } from '@/lib/staffAuth';
import { STAFF_JOB_ROLE_OPTIONS, type StaffJobRole } from '@/lib/staffMockData';

export default function StaffCreateMemberForm({
  onCreated,
  onSuccess,
}: {
  onCreated?: () => void;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<StaffJobRole[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: StaffJobRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const result = await createStaffMember({
      name,
      username,
      password,
      email: email || undefined,
      phone: phone || undefined,
      jobRoles: roles,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(`Staff "${result.user.name}" created. Login: ${result.user.username}`);
    setName('');
    setUsername('');
    setPassword('');
    setEmail('');
    setPhone('');
    setRoles([]);
    onCreated?.();
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-gray-800 bg-gray-100 border border-gray-200 rounded-xl px-3 py-2">
          {success}
        </p>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="Priya Sharma"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="priya"
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            placeholder="priya@plantsingarden.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Office mobile (optional)</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
          placeholder="+91 98765 43210"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">Roles (select multiple)</label>
        <div className="flex flex-wrap gap-2">
          {STAFF_JOB_ROLE_OPTIONS.map((opt) => {
            const selected = roles.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleRole(opt.id)}
                className={`text-xs px-3 py-2 rounded-full border font-medium transition-colors ${
                  selected
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-2xl text-sm font-semibold disabled:opacity-60"
      >
        {loading ? 'Creating…' : 'Create staff member'}
      </button>
    </form>
  );
}
