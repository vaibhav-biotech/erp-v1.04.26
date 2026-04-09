'use client';
import { FiCheck } from 'react-icons/fi';

interface VariantCardProps {
  variant: {
    name: string;
    price: number;
    tag?: string;
  };
  active: boolean;
  onClick: () => void;
}

export default function VariantCard({ variant, active, onClick }: VariantCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg px-4 py-3 min-w-[120px] transition-all border-2 font-montserrat bg-white ${
        active
          ? 'border-gray-300'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Check Badge - Only Green Part */}
      {active && (
        <div className="absolute top-2 right-2 bg-green-600 text-white rounded-full flex items-center justify-center w-5 h-5">
          <FiCheck size={12} strokeWidth={3} />
        </div>
      )}

      {/* Tag */}
      {variant.tag && (
        <div className="absolute -top-3 left-3 text-xs bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full font-semibold">
          {variant.tag}
        </div>
      )}

      <p className="font-normal text-sm mb-1 text-gray-900">
        {variant.name}
      </p>
      <p className="text-lg font-semibold text-gray-900">
        ₹{variant.price}
      </p>
    </div>
  );
}
