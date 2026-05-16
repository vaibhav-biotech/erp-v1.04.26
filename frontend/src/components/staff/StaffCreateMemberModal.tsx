'use client';

import StaffCreateMemberForm from './StaffCreateMemberForm';

interface StaffCreateMemberModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

export default function StaffCreateMemberModal({ onClose, onCreated }: StaffCreateMemberModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900">Create staff member</h3>
        <p className="text-sm text-gray-500 mt-1">Username, password & roles</p>
        <div className="mt-4">
          <StaffCreateMemberForm
            onCreated={onCreated}
            onSuccess={() => setTimeout(onClose, 500)}
          />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-2xl"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
