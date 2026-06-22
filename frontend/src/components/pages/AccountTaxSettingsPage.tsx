'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';

interface TaxSettings {
  enabled: boolean;
  rate: number;
}

const DEFAULT_SETTINGS: TaxSettings = {
  enabled: false,
  rate: 18,
};

export default function AccountTaxSettingsPage() {
  const { adminToken } = useAuth();
  const [settings, setSettings] = useState<TaxSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(buildApiUrl('/api/admin/tax-settings/admin'), {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to load tax settings');

      const payload = await res.json();
      const data = payload?.data || DEFAULT_SETTINGS;
      setSettings({
        enabled: Boolean(data.enabled),
        rate: Number.isFinite(Number(data.rate)) ? Number(data.rate) : 18,
      });
      setStatusMsg('');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load tax settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatusMsg('');

      const safeRate = Math.max(0, Math.min(100, Number(settings.rate) || 0));
      const res = await fetch(buildApiUrl('/api/admin/tax-settings/admin'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getApiHeaders(adminToken || undefined),
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          enabled: settings.enabled,
          rate: safeRate,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.message || payload?.error || 'Failed to save tax settings');
      }

      setSettings((prev) => ({ ...prev, rate: safeRate }));
      setStatusMsg('Tax settings updated');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to save tax settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        
        <p className="text-gray-600 mt-1">Control additional GST charges for checkout.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        {loading ? (
          <p className="text-gray-600">Loading tax settings...</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add GST on top of final price</h2>
                <p className="text-sm text-gray-600">
                  Keep this off if your product prices already include tax.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${
                  settings.enabled ? 'bg-green-600' : 'bg-gray-300'
                }`}
                aria-pressed={settings.enabled}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={settings.rate}
                onChange={(e) => setSettings((prev) => ({ ...prev, rate: Number(e.target.value) }))}
                disabled={!settings.enabled}
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Applied only when toggle is ON.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}

        {statusMsg && (
          <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
            {statusMsg}
          </div>
        )}
      </div>
    </div>
  );
}
