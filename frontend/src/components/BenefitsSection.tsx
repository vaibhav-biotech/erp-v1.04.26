'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface BenefitsSectionProps {
  benefits?: string[];
}

export default function BenefitsSection({ benefits }: BenefitsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!benefits || benefits.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-lg font-semibold text-gray-900">Key Benefits</h3>
        <FiChevronDown
          size={20}
          className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-4 bg-white space-y-3 border-t border-gray-200">
          {benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-green-600 font-bold mt-1">✓</span>
              <span className="text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
