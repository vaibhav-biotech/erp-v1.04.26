'use client';

import { useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/components/PublicLayout';
import { fetchWithStore } from '@/lib/storeConfig';
import { STATIC_PAGE_DEFAULTS, StaticPageSlug } from '@/lib/staticPageDefaults';

interface StaticPageApiRecord {
  slug: StaticPageSlug;
  title?: string;
  content?: string;
}

export default function StaticPageTemplate({ slug }: { slug: StaticPageSlug }) {
  const fallback = STATIC_PAGE_DEFAULTS[slug];
  const [loading, setLoading] = useState(true);
  const [record, setRecord] = useState<StaticPageApiRecord | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await fetchWithStore(`/api/landing/static-pages/${slug}`);
        if (!res.ok) throw new Error('Failed to load static page');

        const payload = await res.json();
        if (!mounted) return;

        const data = payload?.data && typeof payload.data === 'object' ? payload.data : null;
        setRecord(data);
      } catch {
        if (mounted) setRecord(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const title = useMemo(() => {
    const apiTitle = String(record?.title || '').trim();
    return apiTitle || fallback.title;
  }, [record, fallback.title]);

  const content = useMemo(() => {
    const apiContent = String(record?.content || '').trim();
    return apiContent || fallback.content;
  }, [record, fallback.content]);

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{title}</h1>
        </header>

        {loading ? (
          <p className="text-gray-600">Loading...</p>
        ) : (
          <article className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-8">
            <div className="text-gray-700 leading-7 whitespace-pre-wrap">{content}</div>
          </article>
        )}
      </div>
    </PublicLayout>
  );
}
