'use client';

import PublicLayout from '@/components/PublicLayout';
import LandingBannerHero from '@/components/LandingBannerHero';
import TopPicksSection from '@/components/TopPicksSection';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';

export default function Home() {
  return (
    <PublicLayout>
      <div className="pt-0 pb-4 sm:pb-6">
        <LandingBannerHero />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TopPicksSection />
          <WhyChooseUsSection />

          <div className="text-center mt-8 sm:mt-10">
            <p className="text-lg text-gray-700">Fresh plants, seeds & garden supplies</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
