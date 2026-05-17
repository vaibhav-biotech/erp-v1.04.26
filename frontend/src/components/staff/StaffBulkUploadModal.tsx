'use client';

import { useState } from 'react';
import { importContactsBulk, parseBulkFile, type BulkRow } from '@/lib/staffContacts';

interface StaffBulkUploadModalProps {
  defaultAssignedToId: string;
  isAdmin?: boolean;
  onClose: () => void;
  onImported?: () => void;
}

export default function StaffBulkUploadModal({
  defaultAssignedToId,
  isAdmin = false,
  onClose,
  onImported,
}: StaffBulkUploadModalProps) {
  const [rows, setRows] = useState<BulkRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setImportResult(null);
    const result = await parseBulkFile(file);
    setLoading(false);
    if (!result.ok) {
      setParseErrors([result.error]);
      setRows([]);
      return;
    }
    setRows(result.rows);
    setParseErrors(result.errors);
  };

  const handleImport = () => {
    if (!rows.length) return;
    const { imported, skipped, errors } = importContactsBulk(rows, defaultAssignedToId, {
      staffOnlyAssignSelf: !isAdmin,
    });
    setImportResult(
      `Imported ${imported} contact${imported !== 1 ? 's' : ''}. Skipped ${skipped} duplicate${skipped !== 1 ? 's' : ''}.`
    );
    if (errors.length) setParseErrors(errors);
    onImported?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-gray-900">Bulk upload contacts</h3>
        <p className="text-sm text-gray-500 mt-1">
          CSV or Excel — columns: name, phone, email, city, notes
          {isAdmin ? ', assigned_username' : ''}.{' '}
          {isAdmin ? '' : 'All rows assign to you.'}
        </p>
        <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-2 py-1.5 mt-2">
          Each phone number can only exist once in the company — duplicates are skipped if already
          on any staff list.
        </p>

        <a
          href="/staff-contacts-sample.csv"
          download="staff-contacts-sample.csv"
          className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-gray-800 underline underline-offset-2 hover:text-gray-600"
        >
          Download sample CSV
        </a>

        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFile}
          className="mt-4 w-full text-sm"
        />

        {loading && <p className="text-sm text-gray-500 mt-2">Reading file…</p>}

        {parseErrors.length > 0 && (
          <ul className="mt-3 text-xs text-amber-800 bg-amber-50 rounded-xl p-3 space-y-1 max-h-24 overflow-y-auto">
            {parseErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        )}

        {rows.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-800">{rows.length} rows ready</p>
            <div className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-gray-100 text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 text-gray-500">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 5 && (
                <p className="p-2 text-gray-400">+{rows.length - 5} more…</p>
              )}
            </div>
          </div>
        )}

        {importResult && (
          <p className="text-sm text-green-800 bg-green-50 rounded-xl p-3 mt-3">{importResult}</p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            disabled={!rows.length}
            onClick={handleImport}
            className="flex-1 bg-gray-900 disabled:opacity-50 text-white py-2.5 rounded-2xl text-sm font-medium"
          >
            Import
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
    </div>
  );
}
