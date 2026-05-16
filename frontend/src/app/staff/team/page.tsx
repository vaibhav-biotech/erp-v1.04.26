'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StaffCreateMemberModal from '@/components/staff/StaffCreateMemberModal';
import StaffManageMemberModal from '@/components/staff/StaffManageMemberModal';
import StaffMarkAttendanceModal from '@/components/staff/StaffMarkAttendanceModal';
import { StaffPanel, StaffSectionTitle } from '@/components/staff/StaffShell';
import { getStaffSession, getStaffUsers } from '@/lib/staffAuth';
import { JOB_ROLE_LABELS, type StaffUser } from '@/lib/staffMockData';

export default function StaffTeamPage() {
  const router = useRouter();
  const session = getStaffSession();
  const isAdmin = session?.user.role === 'staff_admin';
  const [members, setMembers] = useState<StaffUser[]>(() =>
    getStaffUsers().filter((u) => u.role === 'staff')
  );
  const [showCreate, setShowCreate] = useState(false);
  const [markFor, setMarkFor] = useState<StaffUser | null>(null);
  const [manageFor, setManageFor] = useState<StaffUser | null>(null);

  const reload = useCallback(() => {
    setMembers(getStaffUsers().filter((u) => u.role === 'staff'));
  }, []);

  useEffect(() => {
    if (!isAdmin) router.replace('/staff');
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  return (
    <div className="space-y-5">
      <StaffPanel>
        <div className="flex items-center justify-between mb-4">
          <StaffSectionTitle>Team list</StaffSectionTitle>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-2 rounded-2xl"
          >
            + Create staff
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500 text-xs uppercase">
                <th className="py-3 px-2">Name</th>
                <th className="py-3 px-2">Username</th>
                <th className="py-3 px-2">Office mobile</th>
                <th className="py-3 px-2">Roles</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No staff yet. Tap Create staff to add one.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className={!m.active ? 'opacity-60' : ''}>
                    <td className="py-3 px-2 font-medium text-gray-900">{m.name}</td>
                    <td className="py-3 px-2 text-gray-600">{m.username}</td>
                    <td className="py-3 px-2 text-gray-600 text-xs">
                      {m.phone || '—'}
                    </td>
                    <td className="py-3 px-2 text-xs text-gray-600">
                      {m.jobRoles.map((r) => JOB_ROLE_LABELS[r]).join(', ')}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          m.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {m.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setManageFor(m)}
                          className="text-xs font-medium text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 px-2.5 py-1.5 rounded-lg"
                        >
                          Manage
                        </button>
                        {m.active && (
                          <button
                            type="button"
                            onClick={() => setMarkFor(m)}
                            className="text-xs font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap"
                          >
                            Attendance
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </StaffPanel>

      {showCreate && (
        <StaffCreateMemberModal
          onClose={() => setShowCreate(false)}
          onCreated={reload}
        />
      )}

      {manageFor && (
        <StaffManageMemberModal
          member={manageFor}
          onClose={() => setManageFor(null)}
          onUpdated={reload}
        />
      )}

      {markFor && (
        <StaffMarkAttendanceModal member={markFor} onClose={() => setMarkFor(null)} />
      )}
    </div>
  );
}
