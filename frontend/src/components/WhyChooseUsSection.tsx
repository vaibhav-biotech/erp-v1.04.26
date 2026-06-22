'use client';

import { FiTruck, FiPackage, FiShield, FiCheckCircle } from 'react-icons/fi';

const items = [
  {
    icon: FiTruck,
    title: 'Free Shipping',
    description: 'Free Delivery Over $50',
  },
  {
    icon: FiPackage,
    title: 'Easy Returns',
    description: '30-Day Free Returns',
  },
  {
    icon: FiShield,
    title: 'Secure Payment',
    description: '100% Secure Checkout',
  },
  {
    icon: FiCheckCircle,
    title: 'Quality Guarantee',
    description: '2-Year Warranty Included',
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-8 sm:py-10">
      <div className="text-center mb-6 sm:mb-8">
        
        <p className="mt-2 text-sm sm:text-base text-gray-600">Quality and care you can always trust</p>
      </div>

      <div className="lg:hidden flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`min-w-[170px] sm:min-w-[190px] text-center px-2 py-3 rounded-xl border border-gray-200 bg-white ${index !== items.length - 1 ? 'border-r' : ''}`}
            >
              <div className="w-11 h-11 mx-auto rounded-full border border-gray-300 text-gray-700 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="mt-3 text-sm sm:text-base font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="hidden lg:grid lg:grid-cols-4 gap-8 lg:gap-6">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`text-center px-2 ${index !== items.length - 1 ? 'lg:border-r lg:border-gray-200' : ''}`}
            >
              <div className="w-14 h-14 mx-auto rounded-full border border-gray-300 text-gray-700 flex items-center justify-center">
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{item.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
