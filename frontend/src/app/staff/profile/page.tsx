'use client';

import { logoutStaff, getStaffSession } from '@/lib/staffAuth';
import { StaffPanel } from '@/components/staff/StaffShell';
import { JOB_ROLE_LABELS } from '@/lib/staffMockData';

export default function StaffProfilePage() {
  const session = getStaffSession();
  if (!session) return null;
  const { user } = session;

  return (
    <StaffPanel className="text-center">
      <div className="w-20 h-20 rounded-full bg-gray-900 text-white text-2xl font-bold flex items-center justify-center mx-auto">
        {user.avatarInitials}
      </div>
      <h2 className="text-lg font-semibold mt-4">{user.name}</h2>
      <p className="text-sm text-gray-500">{user.email}</p>
      <p className="text-sm text-gray-700 font-medium mt-2 capitalize">{user.role.replace('_', ' ')}</p>
      <p className="text-xs text-gray-500 mt-1">@{user.username}</p>
      {user.phone ? (
        <p className="text-xs text-gray-600 mt-1">Office: {user.phone}</p>
      ) : null}
      <p className="text-xs text-gray-400 mt-2">
        {user.jobRoles.map((j) => JOB_ROLE_LABELS[j]).join(' · ')}
      </p>
      <button
        type="button"
        onClick={() => {
          logoutStaff();
          window.location.href = '/staff/login';
        }}
        className="w-full mt-6 py-3 rounded-2xl border border-red-200 text-red-600 font-medium hover:bg-red-50"
      >
        Log out
      </button>
    </StaffPanel>
  );
}
