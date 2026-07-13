'use client';

import dynamic from 'next/dynamic';
import PublicLayout from '@/components/PublicLayout';
import LandingBannerHero from '@/components/LandingBannerHero';

function SectionSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div
      className={`rounded-xl bg-gray-50 animate-pulse ${tall ? 'min-h-[280px]' : 'min-h-[160px]'}`}
      aria-hidden
    />
  );
}

const CategoryCircleSection = dynamic(() => import('@/components/CategoryCircleSection'), {
  loading: () => <SectionSkeleton />,
});
const TopPicksSection = dynamic(() => import('@/components/TopPicksSection'), {
  loading: () => <SectionSkeleton />,
});
const FeaturedCollectionsSection = dynamic(
  () => import('@/components/FeaturedCollectionsSection'),
  { loading: () => <SectionSkeleton tall /> }
);
const WhyChooseUsSection = dynamic(() => import('@/components/WhyChooseUsSection'), {
  loading: () => <SectionSkeleton />,
});
const DynamicSections = dynamic(() => import('@/components/DynamicSections'), {
  loading: () => <SectionSkeleton tall />,
});
const GiftSection = dynamic(() => import('@/components/GiftSection'), {
  loading: () => <SectionSkeleton tall />,
});
const CraftedWithCareSection = dynamic(() => import('@/components/CraftedWithCareSection'), {
  loading: () => <SectionSkeleton />,
});

export default function Home() {
  return (
    <PublicLayout>
      <div className="pt-0 pb-10 sm:pb-12 lg:pb-16">
        <LandingBannerHero />

        <div className="mt-10 sm:mt-12 lg:mt-16">
          <CategoryCircleSection />
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <TopPicksSection />
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-16">
          <FeaturedCollectionsSection />
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WhyChooseUsSection />
        </div>

        <DynamicSections />

        <div className="mt-8 sm:mt-10 lg:mt-12">
          <GiftSection />
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-16">
          <CraftedWithCareSection />
        </div>

        <div className="mt-10 sm:mt-12 lg:mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-gray-700">Fresh plants, seeds & garden supplies</p>
        </div>
      </div>
    </PublicLayout>
  );
}
