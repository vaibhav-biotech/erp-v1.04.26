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
    <section className="py-10 sm:py-12">
      <div className="text-center mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Why Choose Us</h2>
        <p className="mt-2 text-sm sm:text-base text-gray-600">Quality and care you can always trust</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
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
