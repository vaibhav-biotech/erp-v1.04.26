'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import Button from '@/components/Button';

interface FooterSettingsForm {
  brandDescription: string;
  email: string;
  phone: string;
  whatsapp: string;
  addressLine1: string;
  addressLine2: string;
}

const DEFAULT_FORM: FooterSettingsForm = {
  brandDescription: 'Your one-stop destination for premium plants and gardening solutions.',
  email: 'info@plantsingarden.com',
  phone: '+91-9000000000',
  whatsapp: '+91-9000000000',
  addressLine1: 'Garden Lane, Greenville',
  addressLine2: 'CA 90210',
};

export default function FooterSettingsPanel() {
  const { adminToken } = useAuth();
  const [form, setForm] = useState<FooterSettingsForm>(DEFAULT_FORM);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchFooterSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(buildApiUrl('/api/landing/footer-settings/admin'), {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch footer settings');
      const payload = await res.json();
      const data = payload?.data && typeof payload.data === 'object' ? payload.data : {};

      setForm({
        brandDescription: String(data.brandDescription || DEFAULT_FORM.brandDescription),
        email: String(data.email || DEFAULT_FORM.email),
        phone: String(data.phone || DEFAULT_FORM.phone),
        whatsapp: String(data.whatsapp || DEFAULT_FORM.whatsapp),
        addressLine1: String(data.addressLine1 || DEFAULT_FORM.addressLine1),
        addressLine2: String(data.addressLine2 || DEFAULT_FORM.addressLine2),
      });
      setStatusMsg('');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load footer settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setStatusMsg('');

      const res = await fetch(buildApiUrl('/api/landing/footer-settings/admin'), {
        method: 'PUT',
        headers: {
          ...getApiHeaders(adminToken || undefined),
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(form),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.message || payload?.error || 'Failed to save footer settings');
      }

      setStatusMsg('Footer settings updated');
      await fetchFooterSettings();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to save footer settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Footer Settings</h2>
          <p className="mt-1 text-sm text-gray-500">Edit footer contact details and address shown on all public pages.</p>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-6 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">
          {statusMsg}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-600">Loading footer settings...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Description</label>
            <textarea
              value={form.brandDescription}
              onChange={(e) => setForm((prev) => ({ ...prev, brandDescription: e.target.value }))}
              className="w-full min-h-[90px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
              <input
                type="text"
                value={form.addressLine1}
                onChange={(e) => setForm((prev) => ({ ...prev, addressLine1: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
              <input
                type="text"
                value={form.addressLine2}
                onChange={(e) => setForm((prev) => ({ ...prev, addressLine2: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button variant="primary" onClick={handleSave} loading={isSaving}>Save Footer Details</Button>
          </div>
        </div>
      )}
    </div>
  );
}
