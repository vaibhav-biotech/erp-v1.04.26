'use client';

import { useState } from 'react';
import { adminResetStaffPassword, adminUpdateStaffMember } from '@/lib/staffAuth';
import { STAFF_JOB_ROLE_OPTIONS, type StaffJobRole, type StaffUser } from '@/lib/staffMockData';

interface StaffManageMemberModalProps {
  member: StaffUser;
  onClose: () => void;
  onUpdated?: () => void;
}

export default function StaffManageMemberModal({
  member,
  onClose,
  onUpdated,
}: StaffManageMemberModalProps) {
  const [name, setName] = useState(member.name);
  const [username, setUsername] = useState(member.username);
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone ?? '');
  const [roles, setRoles] = useState<StaffJobRole[]>(member.jobRoles);
  const [active, setActive] = useState(member.active);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleRole = (role: StaffJobRole) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const wantsPassword = newPassword.length > 0 || confirmPassword.length > 0;
    if (wantsPassword) {
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setSaving(true);
    const detailsResult = await adminUpdateStaffMember(member.id, {
      name,
      username,
      email,
      phone,
      active,
      jobRoles: roles,
    });
    if (!detailsResult.ok) {
      setError(detailsResult.error);
      setSaving(false);
      return;
    }

    if (wantsPassword) {
      const pwResult = await adminResetStaffPassword(member.id, newPassword);
      if (!pwResult.ok) {
        setError(pwResult.error);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    onUpdated?.();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900">Edit staff</h3>
        <p className="text-xs text-gray-500 mt-1">Admin only</p>

        <form onSubmit={handleSave} className="space-y-3 mt-4">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Full name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Office mobile</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Roles</label>
            <div className="flex flex-wrap gap-2">
              {STAFF_JOB_ROLE_OPTIONS.map((opt) => {
                const selected = roles.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleRole(opt.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
                      selected
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Account active</p>
              <p className="text-xs text-gray-500">Inactive staff cannot log in</p>
            </div>
            <button
              type="button"
              onClick={() => setActive((v) => !v)}
              className={`relative w-12 h-7 rounded-full shrink-0 ${
                active ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  active ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-3">
            <p className="text-xs text-gray-500">
              Leave blank to keep current password
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-gray-400"
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-2xl text-sm font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl text-sm text-gray-600 border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
