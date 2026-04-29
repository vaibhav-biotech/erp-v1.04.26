'use client';

import { motion } from 'framer-motion';
import PublicLayout from '@/components/PublicLayout';
import LandingBannerHero from '@/components/LandingBannerHero';
import CategoryCircleSection from '@/components/CategoryCircleSection';
import TopPicksSection from '@/components/TopPicksSection';
import WhyChooseUsSection from '@/components/WhyChooseUsSection';
import OffersSection from '@/components/OffersSection';

const fadeInUp: any = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export default function Home() {
  return (
    <PublicLayout>
      <div className="pt-0 pb-4 sm:pb-6">
        <motion.div
          variants={fadeInUp}
          initial="hidden"
          animate="show"
        >
          <LandingBannerHero />
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
        >
          <CategoryCircleSection />
        </motion.div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          >
            <TopPicksSection />
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          >
            <WhyChooseUsSection />
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
          >
            <OffersSection />
          </motion.div>

          <motion.div
            className="text-center mt-8 sm:mt-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            <p className="text-lg text-gray-700">Fresh plants, seeds & garden supplies</p>
          </motion.div>
        </div>
      </div>
    </PublicLayout>
  );
}
