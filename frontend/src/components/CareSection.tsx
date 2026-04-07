'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface CareSectionProps {
  care?: string[];
}

export default function CareSection({ care }: CareSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!care || care.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
      >
        <h3 className="text-lg font-semibold text-gray-900">Care Instructions</h3>
        <FiChevronDown
          size={20}
          className={`text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="p-4 bg-white space-y-3 border-t border-gray-200">
          {care.map((instruction, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-blue-600 font-semibold min-w-fit">{idx + 1}.</span>
              <span className="text-gray-700">{instruction}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
