'use client';

import PublicLayout from '@/components/PublicLayout';

export default function Home() {
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-8 py-24">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-black mb-4">
            🌿 Plants In Garden
          </h1>
          <p className="text-2xl text-black mb-8">
            Your online nursery shop
          </p>
          <p className="text-lg text-gray-600">
            Fresh plants, seeds & garden supplies
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
