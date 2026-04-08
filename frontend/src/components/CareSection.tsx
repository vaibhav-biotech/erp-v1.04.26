'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiActivity } from 'react-icons/fi';

interface CareSectionProps {
  care?: string[];
}

export default function CareSection({ care }: CareSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!care || care.length === 0) return null;

  return (
    <div className="border-b border-gray-200 py-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between hover:text-green-600 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <FiActivity className="text-xl text-gray-400 group-hover:text-green-600 transition-colors" />
          <h3 className="text-base font-montserrat font-normal text-gray-900 uppercase tracking-wide">Care Instructions</h3>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <FiChevronDown className="text-xl text-gray-400 group-hover:text-green-600 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-4 pl-8 pr-4 space-y-4">
              {care.map((instruction, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="text-green-600 font-normal flex-shrink-0 text-sm">{idx + 1}.</span>
                  <span className="text-gray-700 font-montserrat font-light text-sm">{instruction}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
