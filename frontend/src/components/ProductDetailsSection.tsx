'use client';

import React, { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductDetailsSectionProps {
  description?: string;
  benefits?: string[];
  care?: string[];
}

type ActiveTab = 'description' | 'benefits' | 'care';

export default function ProductDetailsSection({
  description,
  benefits = [],
  care = []
}: ProductDetailsSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('description');

  const renderDescription = () => {
    if (!description) return <p className="text-gray-500">No description available</p>;
    
    return (
      <div className="space-y-4">
        <p className="text-gray-700 font-montserrat text-sm leading-relaxed whitespace-pre-wrap">
          {description}
        </p>
      </div>
    );
  };

  const renderBenefits = () => {
    if (!benefits || benefits.length === 0) {
      return <p className="text-gray-500">No benefits available</p>;
    }

    return (
      <ul className="space-y-3">
        {benefits.map((benefit, idx) => (
          <li key={idx} className="flex gap-3 items-start">
            <span className="text-green-600 mt-1 flex-shrink-0">
              <FiCheck size={20} />
            </span>
            <span className="text-gray-700 font-montserrat text-sm leading-relaxed">
              {benefit}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const renderCare = () => {
    if (!care || care.length === 0) {
      return <p className="text-gray-500">No care information available</p>;
    }

    return (
      <ul className="space-y-3">
        {care.map((item, idx) => (
          <li key={idx} className="flex gap-3 items-start">
            <span className="text-green-600 mt-1 flex-shrink-0">
              <FiCheck size={20} />
            </span>
            <span className="text-gray-700 font-montserrat text-sm leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('description')}
          className={`flex-1 px-4 py-4 sm:px-6 text-center font-montserrat font-medium transition-all ${
            activeTab === 'description'
              ? 'text-green-600 border-b-2 border-green-600 bg-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <span className="hidden sm:inline mr-2">📝</span>
          Description
        </button>
        <button
          onClick={() => setActiveTab('benefits')}
          className={`flex-1 px-4 py-4 sm:px-6 text-center font-montserrat font-medium transition-all ${
            activeTab === 'benefits'
              ? 'text-green-600 border-b-2 border-green-600 bg-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <span className="hidden sm:inline mr-2">✨</span>
          Benefits
        </button>
        <button
          onClick={() => setActiveTab('care')}
          className={`flex-1 px-4 py-4 sm:px-6 text-center font-montserrat font-medium transition-all ${
            activeTab === 'care'
              ? 'text-green-600 border-b-2 border-green-600 bg-white'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <span className="hidden sm:inline mr-2">🌿</span>
          Care Guide
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'description' && renderDescription()}
            {activeTab === 'benefits' && renderBenefits()}
            {activeTab === 'care' && renderCare()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
