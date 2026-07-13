'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { buildApiUrl, getApiHeaders } from '@/lib/storeConfig';
import Button from '@/components/Button';
import {
  STATIC_PAGE_DEFAULTS,
  STATIC_PAGE_OPTIONS,
  StaticPageSlug,
} from '@/lib/staticPageDefaults';

interface StaticPageRecord {
  _id?: string;
  slug: StaticPageSlug;
  title?: string;
  content?: string;
  isActive?: boolean;
  updatedAt?: string;
}

export default function StaticPagesSettingsPanel() {
  const { adminToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [records, setRecords] = useState<Record<StaticPageSlug, StaticPageRecord>>({} as Record<StaticPageSlug, StaticPageRecord>);
  const [activeSlug, setActiveSlug] = useState<StaticPageSlug>('about-us');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const applyRecordToEditor = (slug: StaticPageSlug, source: Record<StaticPageSlug, StaticPageRecord>) => {
    const fallback = STATIC_PAGE_DEFAULTS[slug];
    const current = source[slug];
    setTitle(String(current?.title || fallback.title));
    setContent(String(current?.content || fallback.content));
  };

  const fetchStaticPages = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(buildApiUrl('/api/landing/static-pages/admin'), {
        headers: {
          ...getApiHeaders(adminToken || undefined),
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) throw new Error('Failed to fetch static pages');
      const payload = await res.json();
      const list = Array.isArray(payload?.data) ? payload.data : [];

      const nextRecords: Record<StaticPageSlug, StaticPageRecord> = { ...STATIC_PAGE_DEFAULTS };
      for (const item of list) {
        const slug = item?.slug as StaticPageSlug;
        if (!slug || !nextRecords[slug]) continue;

        nextRecords[slug] = {
          ...nextRecords[slug],
          ...item,
        };
      }

      setRecords(nextRecords);
      applyRecordToEditor(activeSlug, nextRecords);
      setStatusMsg('');
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to load static pages');
      const fallbackRecords = { ...STATIC_PAGE_DEFAULTS } as Record<StaticPageSlug, StaticPageRecord>;
      setRecords(fallbackRecords);
      applyRecordToEditor(activeSlug, fallbackRecords);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaticPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

  const lastUpdatedText = useMemo(() => {
    const updatedAt = records?.[activeSlug]?.updatedAt;
    if (!updatedAt) return 'Not saved yet (using default content)';
    return `Last updated: ${new Date(updatedAt).toLocaleString()}`;
  }, [records, activeSlug]);

  const handleSlugChange = (slug: StaticPageSlug) => {
    setActiveSlug(slug);
    applyRecordToEditor(slug, records);
  };

  const handleReset = () => {
    const fallback = STATIC_PAGE_DEFAULTS[activeSlug];
    setTitle(fallback.title);
    setContent(fallback.content);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setStatusMsg('');

      const res = await fetch(buildApiUrl(`/api/landing/static-pages/admin/${activeSlug}`), {
        method: 'PUT',
        headers: {
          ...getApiHeaders(adminToken || undefined),
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          isActive: true,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.message || payload?.error || 'Failed to save static page');
      }

      setStatusMsg('Static page content saved');
      await fetchStaticPages();
    } catch (error) {
      setStatusMsg(error instanceof Error ? error.message : 'Failed to save static page');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Static Pages Content</h2>
          <p className="mt-1 text-sm text-gray-500">Edit content for your About Us, Privacy Policy, Terms, and Shipping pages.</p>
        </div>
      </div>

      {statusMsg && (
        <div className="mb-6 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm border border-blue-200">
          {statusMsg}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-600">Loading static page content...</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Page</label>
            <select
              value={activeSlug}
              onChange={(e) => handleSlugChange(e.target.value as StaticPageSlug)}
              className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {STATIC_PAGE_OPTIONS.map((opt) => (
                <option key={opt.slug} value={opt.slug}>{opt.label}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">{lastUpdatedText}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Enter page title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Page Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[380px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Enter page content"
            />
            <p className="text-xs text-gray-500 mt-1">Use plain text. Line breaks will be shown on the public page.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button variant="secondary" onClick={handleReset}>Reset to Default</Button>
            <Button variant="primary" onClick={handleSave} loading={isSaving}>Save Page</Button>
          </div>
        </div>
      )}
    </div>
  );
}
