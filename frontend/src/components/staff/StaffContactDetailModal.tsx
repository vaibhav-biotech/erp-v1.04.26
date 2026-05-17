'use client';

import { useMemo } from 'react';
import {
  CONTACT_STATUS_LABELS,
  CALL_OUTCOME_LABELS,
  type StaffContact,
} from '@/lib/staffMockData';
import { getStoreById } from '@/lib/staffStores';
import {
  formatCallDateTime,
  getCallLogsForContact,
  getContactStats,
  getStaffName,
} from '@/lib/staffContacts';

interface StaffContactDetailModalProps {
  contact: StaffContact;
  isAdmin: boolean;
  onClose: () => void;
  onLogCall: () => void;
}

export default function StaffContactDetailModal({
  contact,
  isAdmin,
  onClose,
  onLogCall,
}: StaffContactDetailModalProps) {
  const logs = useMemo(() => getCallLogsForContact(contact.id), [contact.id]);
  const { totalCalls } = getContactStats(contact.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl border border-gray-100 shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 shrink-0">
          <h3 className="font-semibold text-gray-900 text-lg">{contact.name}</h3>
          <a href={`tel:${contact.phone}`} className="text-sm text-gray-700 mt-1 block">
            {contact.phone}
          </a>
          <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-600">
            {contact.city && <span>{contact.city}</span>}
            {contact.email && <span>· {contact.email}</span>}
            <span>· {CONTACT_STATUS_LABELS[contact.status]}</span>
            {isAdmin && (
              <>
                <span>· {getStaffName(contact.assignedToId)}</span>
                <span>· {contact.source === 'bulk_upload' ? 'Bulk upload' : 'Manual'}</span>
              </>
            )}
          </div>
          {contact.notes && (
            <p className="text-sm text-gray-500 mt-2 bg-gray-50 rounded-xl p-3">{contact.notes}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={onLogCall}
              className="flex-1 bg-gray-900 text-white py-2.5 rounded-2xl text-sm font-medium"
            >
              Log call
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-sm border border-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Call history ({totalCalls})
          </p>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No calls logged yet.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-2xl border border-gray-100 bg-gray-50/80 p-3 text-sm"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {CALL_OUTCOME_LABELS[log.outcome]}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {formatCallDateTime(log.calledAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">By {getStaffName(log.staffId)}</p>
                  {log.outcome === 'create_order' && log.orderStoreId && (
                    <p className="text-xs text-emerald-800 mt-1">
                      Store: {getStoreById(log.orderStoreId)?.name ?? log.orderStoreId}
                    </p>
                  )}
                  {log.durationMinutes != null && (
                    <p className="text-xs text-gray-500">{log.durationMinutes} min</p>
                  )}
                  {log.notes && <p className="text-gray-600 mt-1 text-xs">{log.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
